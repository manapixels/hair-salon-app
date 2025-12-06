/**
 * API Route: /api/telegram/webhook
 *
 * This is the webhook endpoint for Telegram Bot API.
 * It receives incoming messages from users on Telegram, processes them with Gemini,
 * and sends a reply back via the Telegram Bot API.
 */
import { handleMessagingWithUserContext } from '../../../../services/messagingUserService';
import { createUserFromOAuth, findUserByTelegramId } from '@/lib/database';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/services/rateLimitService';
import {
  handleStartCommand,
  handleServicesCommand,
  handleAppointmentsCommand,
  handleBookCommand,
  handleCancelCommand,
  handleRescheduleCommand,
  handleHoursCommand,
  handleHelpCommand,
  handleCallbackQuery,
  type CommandResponse,
} from '@/services/botCommandService';

// Global session store for login tokens
declare global {
  var telegramLoginSessions: Map<
    string,
    {
      telegramId: number;
      firstName: string;
      lastName?: string;
      username?: string;
      photoUrl?: string;
      timestamp: number;
    }
  >;
}

globalThis.telegramLoginSessions = globalThis.telegramLoginSessions || new Map();

/**
 * Sends a chat action (typing indicator) to show the bot is processing
 * @param chatId The chat ID
 * @param action The action type (typing, upload_photo, etc.)
 */
async function sendChatAction(chatId: number, action: string = 'typing'): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendChatAction`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        action: action,
      }),
    });
  } catch (error) {
    // Silently fail - chat actions are not critical
    console.debug('Failed to send chat action:', error);
  }
}

/**
 * Sends a reply to the user via the Telegram Bot API.
 * @param chatId The chat ID where the message should be sent.
 * @param text The message text to send.
 * @param keyboard Optional inline keyboard for buttons.
 * @returns The sent message object with message_id, or null on error
 */
async function sendTelegramReply(
  chatId: number,
  text: string,
  keyboard?: any,
  parseMode: string = 'Markdown',
): Promise<{ message_id: number } | null> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN environment variable is not set.');
    console.log(
      `SIMULATING sending Telegram reply to ${chatId}: "${text}" (because bot token is not set)`,
    );
    return null;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const payload: any = {
    chat_id: chatId,
    text: text,
    parse_mode: parseMode,
  };

  if (keyboard) {
    payload.reply_markup = keyboard;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send Telegram reply:', JSON.stringify(errorData, null, 2));
      throw new Error(`Telegram API request failed with status ${response.status}`);
    }

    console.log(`Successfully sent Telegram reply to chat ${chatId}`);
    const responseData = await response.json();
    console.log('Telegram API Response:', responseData);

    return responseData.result; // Contains message_id
  } catch (error) {
    console.error('Exception when trying to send Telegram reply:', error);
    return null;
  }
}

/**
 * Edits an existing Telegram message
 * @param chatId The chat ID where the message is
 * @param messageId The ID of the message to edit
 * @param text The new text for the message
 * @param keyboard Optional new inline keyboard (null to remove buttons)
 * @returns True if successful, false otherwise
 */
async function editTelegramMessage(
  chatId: number,
  messageId: number,
  text: string,
  keyboard?: any,
  parseMode: string = 'Markdown',
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN environment variable is not set.');
    console.log(
      `SIMULATING editing Telegram message ${messageId} in chat ${chatId}: "${text}" (because bot token is not set)`,
    );
    return false;
  }

  const url = `https://api.telegram.org/bot${botToken}/editMessageText`;

  const payload: any = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: parseMode,
  };

  if (keyboard !== undefined) {
    payload.reply_markup = keyboard;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to edit Telegram message:', JSON.stringify(errorData, null, 2));
      return false;
    }

    console.log(`Successfully edited Telegram message ${messageId} in chat ${chatId}`);
    return true;
  } catch (error) {
    console.error('Exception when trying to edit Telegram message:', error);
    return false;
  }
}

/**
 * Send a command response with proper formatting
 * @param chatId The chat ID to send to
 * @param response The command response to send
 * @param userId The user ID for storing context (optional)
 */
async function sendCommandResponse(
  chatId: number,
  response: CommandResponse,
  userId?: string,
): Promise<void> {
  const sentMessage = await sendTelegramReply(
    chatId,
    response.text,
    response.keyboard,
    response.parseMode,
  );

  // Store message ID for wizard-style editing
  if (sentMessage?.message_id && userId) {
    const { setBookingContext } = await import('@/services/conversationHistory');
    setBookingContext(userId, { currentStepMessageId: sentMessage.message_id });
    console.log(
      '[COMMAND RESPONSE] Stored message ID:',
      sentMessage.message_id,
      'for user:',
      userId,
    );
  }
}

/**
 * Handles /start command with login token
 */
async function handleLoginCommand(
  chatId: number,
  user: any,
  startParam?: string,
): Promise<boolean> {
  if (!startParam || !startParam.startsWith('login_')) {
    return false;
  }

  const loginToken = startParam.substring(6);

  console.log('[LOGIN-WEBHOOK] Starting login command handler');
  console.log('[LOGIN-WEBHOOK] ChatId:', chatId);
  console.log('[LOGIN-WEBHOOK] Token (redacted):', loginToken.substring(0, 10) + '...');

  try {
    const tokenData = await prisma.loginToken.findUnique({
      where: { token: loginToken },
    });

    if (!tokenData) {
      console.error('[LOGIN-WEBHOOK] FAILED: Token not found in database');
      await sendTelegramReply(
        chatId,
        '❌ Invalid or expired login link. Please try logging in again from the website.',
      );
      return true;
    }

    console.log('[LOGIN-WEBHOOK] Token found, checking expiry...');

    if (tokenData.expiresAt.getTime() < Date.now()) {
      console.error('[LOGIN-WEBHOOK] FAILED: Token expired');
      await prisma.loginToken.delete({ where: { id: tokenData.id } });
      await sendTelegramReply(
        chatId,
        '⏰ This login link has expired. Please try logging in again from the website.',
      );
      return true;
    }

    console.log('[LOGIN-WEBHOOK] Token valid, creating/finding user...');

    const fullName = user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    const email = user.username ? `${user.username}@telegram.local` : `${chatId}@telegram.local`;

    let dbUser;
    try {
      dbUser = await createUserFromOAuth({
        name: fullName,
        email,
        authProvider: 'telegram',
        telegramId: chatId,
        avatar: user.photo_url || undefined,
      });
      console.log('[LOGIN-WEBHOOK] User created/found:', dbUser.id);
    } catch (userError) {
      console.error('[LOGIN-WEBHOOK] FAILED: Error creating/finding user:', userError);
      await sendTelegramReply(
        chatId,
        '❌ Failed to create your account. Please try again or contact support.',
      );
      return true;
    }

    console.log('[LOGIN-WEBHOOK] Updating token with userId...');

    try {
      await prisma.loginToken.update({
        where: { id: tokenData.id },
        data: { userId: dbUser.id },
      });
      console.log('[LOGIN-WEBHOOK] Token updated successfully');
    } catch (tokenUpdateError) {
      console.error('[LOGIN-WEBHOOK] FAILED: Error updating token with userId:', tokenUpdateError);
      await sendTelegramReply(
        chatId,
        '❌ Failed to link your login session. Please try logging in again from the website.',
      );
      return true;
    }

    console.log('[LOGIN-WEBHOOK] Sending complete login link to user...');

    const loginUrl = `${process.env.NEXTAUTH_URL}/api/auth/telegram/verify-login?token=${loginToken}`;
    const message = `🎉 *Welcome to Signature Trims!*

Click the button below to complete your login:

[🔐 Complete Login](${loginUrl})

This link will expire in 10 minutes for security.`;

    await sendTelegramReply(chatId, message);

    console.log('[LOGIN-WEBHOOK] SUCCESS: Login flow completed');

    return true;
  } catch (error) {
    console.error('[LOGIN-WEBHOOK] UNEXPECTED ERROR:', error);
    console.error('[LOGIN-WEBHOOK] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    await sendTelegramReply(
      chatId,
      '❌ Something went wrong during login. Please try again from the website.',
    );
    return true;
  }
}

// POST handler for receiving Telegram messages
export async function POST(request: Request) {
  const requestBody = await request.json();

  console.log('Received Telegram webhook payload:', JSON.stringify(requestBody, null, 2));

  const message = requestBody.message;

  if (message && message.text) {
    const chatId = message.chat.id;
    const incomingMessage = message.text;
    const user = message.from;

    // Rate limiting check
    const rateLimitResult = checkRateLimit(chatId.toString());
    if (!rateLimitResult.allowed) {
      console.warn(`[Telegram] Rate limit exceeded for chat ${chatId}`);
      const retryMessage = rateLimitResult.retryAfter
        ? `⏱️ You're sending too many messages. Please try again in ${rateLimitResult.retryAfter} seconds.`
        : "⏱️ You're sending too many messages. Please slow down.";

      await sendTelegramReply(chatId, retryMessage);
      return Response.json({ success: true, rateLimited: true }, { status: 200 });
    }

    try {
      // Check for /start command with login parameter
      if (incomingMessage.startsWith('/start ')) {
        console.log('[WEBHOOK] Detected /start command with parameter');
        const startParam = incomingMessage.substring(7).trim();
        console.log('[WEBHOOK] Start parameter:', startParam);
        const handled = await handleLoginCommand(chatId, user, startParam);
        console.log('[WEBHOOK] Login command handled:', handled);
        if (handled) {
          return Response.json({ success: true }, { status: 200 });
        }
      } else if (incomingMessage === '/start') {
        console.log('[WEBHOOK] Detected /start command without parameter');
      } else {
        console.log('[WEBHOOK] Regular message (not /start):', incomingMessage);
      }

      // Get user context for command handlers
      const dbUser = await findUserByTelegramId(chatId);

      //Handle slash commands
      const userId = chatId.toString();

      if (incomingMessage === '/start') {
        await sendChatAction(chatId);
        const response = await handleStartCommand(dbUser);
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/services') {
        await sendChatAction(chatId);
        const response = await handleServicesCommand();
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/appointments') {
        await sendChatAction(chatId);
        const response = await handleAppointmentsCommand(dbUser);
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/book') {
        await sendChatAction(chatId);
        const response = await handleBookCommand();
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/cancel') {
        await sendChatAction(chatId);
        const response = await handleCancelCommand(dbUser);
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/reschedule') {
        await sendChatAction(chatId);
        const response = await handleRescheduleCommand(dbUser);
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/hours') {
        await sendChatAction(chatId);
        const response = await handleHoursCommand();
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/help') {
        await sendChatAction(chatId);
        const response = await handleHelpCommand();
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      // Show typing indicator for natural language processing
      await sendChatAction(chatId);

      // Use enhanced messaging service with user context for natural language (conversational)
      const { reply: replyText, buttons } = await handleMessagingWithUserContext(
        incomingMessage,
        'telegram',
        chatId,
      );

      // Build inline keyboard ONLY for specific button-based actions (reminders, confirmations)
      // For conversational flow, we generally don't want buttons
      let keyboard = undefined;
      if (buttons && buttons.length > 0) {
        // Only include buttons for reminder/confirmation actions (time-sensitive)
        const isReminderOrConfirmation = buttons.some(
          btn =>
            btn.data.includes('reminder') ||
            btn.data.includes('confirm') ||
            btn.data.includes('cancel_apt') ||
            btn.data.includes('reschedule_apt'),
        );

        if (isReminderOrConfirmation) {
          keyboard = {
            inline_keyboard: [buttons.map(btn => ({ text: btn.text, callback_data: btn.data }))],
          };
        }
        // For other buttons (like booking confirmation), we use text-based confirmation now
      }

      // Conversational flow: Always send new messages (no message editing for conversations)
      console.log('[CONVERSATIONAL] Sending reply to user');
      await sendTelegramReply(chatId, replyText, keyboard);

      // Respond to the webhook request to acknowledge receipt
      return Response.json({ success: true }, { status: 200 });
    } catch (error: any) {
      console.error('Error in Telegram webhook:', error);
      return Response.json({ message: 'Failed to process Telegram message.' }, { status: 500 });
    }
  }

  // Handle callback queries from inline keyboard buttons
  const callbackQuery = requestBody.callback_query;
  if (callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const callbackData = callbackQuery.data;
    const userId = chatId.toString();

    try {
      // Show typing indicator while processing
      await sendChatAction(chatId);

      // Get user context
      const dbUser = await findUserByTelegramId(chatId);

      // Handle the callback with chatId for context storage
      const response = await handleCallbackQuery(callbackData, dbUser, userId);

      // Check if we should edit the previous message or send a new one
      const { getBookingContext } = await import('@/services/conversationHistory');
      const context = getBookingContext(userId);

      console.log('[CALLBACK] CallbackData:', callbackData);
      console.log('[CALLBACK] Edit requested:', response.editPreviousMessage);
      console.log('[CALLBACK] Current message ID:', context?.currentStepMessageId);

      if (response.editPreviousMessage && context?.currentStepMessageId) {
        // EDIT the message that was clicked (wizard-style UX)
        console.log('[CALLBACK] Attempting to edit message:', context.currentStepMessageId);
        const editSuccess = await editTelegramMessage(
          chatId,
          context.currentStepMessageId,
          response.text,
          response.keyboard || null, // null removes keyboard
          response.parseMode,
        );

        // Fallback: if edit fails, send a new message instead
        if (!editSuccess) {
          console.log('[CALLBACK] Edit failed, falling back to new message');
          await sendCommandResponse(chatId, response, userId);
        } else {
          console.log('[CALLBACK] Successfully edited message');
        }
      } else {
        // SEND new message (normal flow)
        console.log('[CALLBACK] Sending new message (no edit requested or no message ID)');
        await sendCommandResponse(chatId, response, userId);
      }

      // Answer the callback query to remove loading state
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callbackQuery.id }),
        });
      }

      return Response.json({ success: true }, { status: 200 });
    } catch (error: any) {
      console.error('Error handling callback query:', error);
      return Response.json({ message: 'Failed to process button click.' }, { status: 500 });
    }
  }

  // This is not a message type we can process. Acknowledge it so Telegram doesn't resend.
  console.log('Received an unhandled payload type.');
  return Response.json(
    { success: true, message: 'Payload received but not a supported message type.' },
    { status: 200 },
  );
}

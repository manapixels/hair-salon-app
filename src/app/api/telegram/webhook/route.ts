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

  const loginToken = startParam.substring(6); // Remove 'login_' prefix

  try {
    // Import token store from start-login endpoint
    const { loginTokens } = await import('../../auth/telegram/start-login/route');

    // Verify token exists and is valid
    const tokenData = loginTokens.get(loginToken);
    if (!tokenData) {
      await sendTelegramReply(
        chatId,
        '❌ Invalid or expired login link. Please try logging in again from the website.',
      );
      return true;
    }

    // Check if token is expired
    if (tokenData.expiresAt.getTime() < Date.now()) {
      loginTokens.delete(loginToken);
      await sendTelegramReply(
        chatId,
        '⏰ This login link has expired. Please try logging in again from the website.',
      );
      return true;
    }

    // Create or update user
    const fullName = user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    const email = user.username ? `${user.username}@telegram.local` : `${chatId}@telegram.local`;

    const dbUser = await createUserFromOAuth({
      name: fullName,
      email,
      authProvider: 'telegram',
      telegramId: chatId,
      avatar: user.photo_url || undefined,
    });

    // Generate session token for the login link
    const sessionToken = randomBytes(32).toString('base64url');

    // Store session data
    globalThis.telegramLoginSessions.set(sessionToken, {
      telegramId: chatId,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      photoUrl: user.photo_url,
      timestamp: Date.now(),
    });

    // Clean up the login token
    loginTokens.delete(loginToken);

    // Send login link to user
    const loginUrl = `${process.env.NEXTAUTH_URL}/api/auth/telegram/verify-login?token=${sessionToken}`;
    const message = `🎉 *Welcome to Luxe Cuts!*

Click the button below to complete your login:

[🔐 Complete Login](${loginUrl})

✨ *What you can do:*
• Book appointments with our professional stylists
• View and manage your bookings
• Get reminders for upcoming appointments
• Chat with me anytime for help

This link will expire in 10 minutes for security.`;

    await sendTelegramReply(chatId, message);

    return true;
  } catch (error) {
    console.error('Error handling login command:', error);
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

    try {
      // Check for /start command with login parameter
      if (incomingMessage.startsWith('/start ')) {
        const startParam = incomingMessage.substring(7).trim();
        const handled = await handleLoginCommand(chatId, user, startParam);
        if (handled) {
          return Response.json({ success: true }, { status: 200 });
        }
      }

      // Get user context for command handlers
      const dbUser = await findUserByTelegramId(chatId);

      //Handle slash commands
      const userId = chatId.toString();

      if (incomingMessage === '/start') {
        const response = await handleStartCommand(dbUser);
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/services') {
        const response = await handleServicesCommand();
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/appointments') {
        const response = await handleAppointmentsCommand(dbUser);
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/book') {
        const response = await handleBookCommand();
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/cancel') {
        const response = await handleCancelCommand(dbUser);
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/reschedule') {
        const response = await handleRescheduleCommand(dbUser);
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/hours') {
        const response = await handleHoursCommand();
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      if (incomingMessage === '/help') {
        const response = await handleHelpCommand();
        await sendCommandResponse(chatId, response, userId);
        return Response.json({ success: true }, { status: 200 });
      }

      // Use enhanced messaging service with user context for natural language
      const { reply: replyText, buttons } = await handleMessagingWithUserContext(
        incomingMessage,
        'telegram',
        chatId,
      );

      // Build inline keyboard if buttons are provided
      let keyboard = undefined;
      if (buttons && buttons.length > 0) {
        keyboard = {
          inline_keyboard: [buttons.map(btn => ({ text: btn.text, callback_data: btn.data }))],
        };
      }

      // Send the generated reply back to the user via the Telegram Bot API
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
      // Get user context
      const dbUser = await findUserByTelegramId(chatId);

      // Handle the callback with chatId for context storage
      const response = await handleCallbackQuery(callbackData, dbUser, userId);

      // Check if we should edit the previous message or send a new one
      const { getBookingContext } = await import('@/services/conversationHistory');
      const context = getBookingContext(userId);

      if (response.editPreviousMessage && context?.currentStepMessageId) {
        // EDIT the message that was clicked (wizard-style UX)
        await editTelegramMessage(
          chatId,
          context.currentStepMessageId,
          response.text,
          response.keyboard || null, // null removes keyboard
          response.parseMode,
        );
      } else {
        // SEND new message (normal flow)
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

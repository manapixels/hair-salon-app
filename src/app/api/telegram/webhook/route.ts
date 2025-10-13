/**
 * API Route: /api/telegram/webhook
 *
 * This is the webhook endpoint for Telegram Bot API.
 * It receives incoming messages from users on Telegram, processes them with Gemini,
 * and sends a reply back via the Telegram Bot API.
 */
import { handleMessagingWithUserContext } from '../../../../services/messagingUserService';
import { createUserFromOAuth } from '@/lib/database';
import { randomBytes } from 'crypto';

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
 */
async function sendTelegramReply(chatId: number, text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN environment variable is not set.');
    console.log(
      `SIMULATING sending Telegram reply to ${chatId}: "${text}" (because bot token is not set)`,
    );
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
  };

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
  } catch (error) {
    console.error('Exception when trying to send Telegram reply:', error);
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
    const email = user.username
      ? `${user.username}@telegram.local`
      : `${chatId}@telegram.local`;

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

      // Handle regular /start command
      if (incomingMessage === '/start') {
        const welcomeMessage = `👋 Welcome to *Luxe Cuts Hair Salon*!

I'm your personal booking assistant. Here's what I can help you with:

✂️ *Book Appointments* - Schedule your next haircut or styling
📅 *Manage Bookings* - View, reschedule, or cancel appointments
💬 *Ask Questions* - Get information about our services and stylists
🔔 *Reminders* - Receive notifications for upcoming appointments

How can I assist you today?`;

        await sendTelegramReply(chatId, welcomeMessage);
        return Response.json({ success: true }, { status: 200 });
      }

      // Use enhanced messaging service with user context
      const { reply: replyText, user: dbUser } = await handleMessagingWithUserContext(
        incomingMessage,
        'telegram',
        chatId,
      );

      // Send the generated reply back to the user via the Telegram Bot API
      await sendTelegramReply(chatId, replyText);

      // Respond to the webhook request to acknowledge receipt
      return Response.json({ success: true }, { status: 200 });
    } catch (error: any) {
      console.error('Error in Telegram webhook:', error);
      return Response.json({ message: 'Failed to process Telegram message.' }, { status: 500 });
    }
  } else {
    // This is not a text message we can process. Acknowledge it so Telegram doesn't resend.
    console.log('Received a non-text message or an unhandled payload type.');
    return Response.json(
      { success: true, message: 'Payload received but not a user text message.' },
      { status: 200 },
    );
  }
}

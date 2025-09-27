/**
 * API Route: /api/telegram/webhook
 *
 * This is the webhook endpoint for Telegram Bot API.
 * It receives incoming messages from users on Telegram, processes them with Gemini,
 * and sends a reply back via the Telegram Bot API.
 */
import { handleMessagingWithUserContext } from '../../../../services/messagingUserService';

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

// POST handler for receiving Telegram messages
export async function POST(request: Request) {
  const requestBody = await request.json();

  console.log('Received Telegram webhook payload:', JSON.stringify(requestBody, null, 2));

  const message = requestBody.message;

  if (message && message.text) {
    const chatId = message.chat.id;
    const incomingMessage = message.text;

    try {
      // Use enhanced messaging service with user context
      const { reply: replyText, user } = await handleMessagingWithUserContext(
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

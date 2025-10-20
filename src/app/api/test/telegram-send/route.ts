import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/services/messagingService';

/**
 * Test endpoint for sending Telegram messages
 * POST /api/test/telegram-send
 *
 * Body: { chatId: number, text: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { chatId, text } = await request.json();

    if (!chatId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: chatId (number), text' },
        { status: 400 }
      );
    }

    const chatIdNumber = typeof chatId === 'string' ? parseInt(chatId) : chatId;

    if (isNaN(chatIdNumber)) {
      return NextResponse.json(
        { error: 'chatId must be a valid number' },
        { status: 400 }
      );
    }

    console.log(`[Test] Sending Telegram message to ${chatIdNumber}`);

    const success = await sendTelegramMessage(chatIdNumber, text);

    return NextResponse.json({
      success,
      message: success
        ? 'Telegram message sent successfully'
        : 'Failed to send Telegram message',
      chatId: chatIdNumber,
      textLength: text.length,
    });
  } catch (error: unknown) {
    console.error('[Test] Telegram send error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test/telegram-send
 * Shows usage instructions
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/test/telegram-send',
    description: 'Send a test Telegram message',
    usage: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        chatId: 123456789,
        text: 'Your test message here',
      },
    },
    example: `curl -X POST http://localhost:3000/api/test/telegram-send \\
  -H "Content-Type: application/json" \\
  -d '{"chatId":123456789,"text":"Test message"}'`,
    note: 'To find your chat ID, send a message to your bot and check https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates',
  });
}

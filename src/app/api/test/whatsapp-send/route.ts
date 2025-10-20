import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/services/messagingService';

/**
 * Test endpoint for sending WhatsApp messages
 * POST /api/test/whatsapp-send
 *
 * Body: { to: string, text: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { to, text } = await request.json();

    if (!to || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: to, text' },
        { status: 400 }
      );
    }

    console.log(`[Test] Sending WhatsApp message to ${to}`);

    const success = await sendWhatsAppMessage(to, text);

    return NextResponse.json({
      success,
      message: success
        ? 'WhatsApp message sent successfully'
        : 'Failed to send WhatsApp message',
      to,
      textLength: text.length,
    });
  } catch (error: unknown) {
    console.error('[Test] WhatsApp send error:', error);
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
 * GET /api/test/whatsapp-send
 * Shows usage instructions
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/test/whatsapp-send',
    description: 'Send a test WhatsApp message',
    usage: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        to: '+1234567890',
        text: 'Your test message here',
      },
    },
    example: `curl -X POST http://localhost:3000/api/test/whatsapp-send \\
  -H "Content-Type: application/json" \\
  -d '{"to":"+1234567890","text":"Test message"}'`,
  });
}

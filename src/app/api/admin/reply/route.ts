import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage, sendTelegramMessage } from '@/services/messagingService';
import { resolveFlag, addMessage, getHistory } from '@/services/conversationHistory';
import { findUserByWhatsAppPhone, findUserByTelegramId } from '@/services/messagingUserService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, message, resolve } = body;

    if (!userId || !message) {
      return NextResponse.json({ error: 'Missing userId or message' }, { status: 400 });
    }

    // userId is actually the platform ID (phone number for WhatsApp, chat ID for Telegram)
    // Try to find user by WhatsApp phone first, then by Telegram ID
    let user = await findUserByWhatsAppPhone(userId);

    if (!user) {
      // Try parsing as Telegram ID (integer)
      const telegramId = parseInt(userId);
      if (!isNaN(telegramId)) {
        user = await findUserByTelegramId(telegramId);
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Send message to user based on their platform
    if (user.authProvider === 'whatsapp' && user.whatsappPhone) {
      await sendWhatsAppMessage(user.whatsappPhone, message);
    } else if (user.authProvider === 'telegram' && user.telegramId) {
      await sendTelegramMessage(user.telegramId, message);
    } else {
      return NextResponse.json({ error: 'User has no messaging platform linked' }, { status: 400 });
    }

    // Add admin message to history (use platform ID as key)
    addMessage(userId, `Admin: ${message}`, 'bot');

    // Resolve flag if requested
    if (resolve) {
      resolveFlag(userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending admin reply:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

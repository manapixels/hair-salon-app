import { NextRequest, NextResponse } from 'next/server';

// Telegram bot setup endpoint - returns bot username for widget
export async function GET(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json({ error: 'Telegram bot not configured' }, { status: 500 });
  }

  try {
    // Get bot information to return username
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botInfo = (await response.json()) as { ok: boolean; result: { username: string } };

    if (!botInfo.ok) {
      throw new Error('Failed to get bot info');
    }

    return NextResponse.json({
      botUsername: botInfo.result.username,
      authUrl: `/api/auth/telegram/callback`,
    });
  } catch (error) {
    console.error('Telegram bot setup error:', error);
    return NextResponse.json({ error: 'Failed to setup Telegram authentication' }, { status: 500 });
  }
}

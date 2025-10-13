import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/secureSession';
import { findUserByTelegramId } from '@/lib/database';

/**
 * Verifies a login session token and creates a session
 * Called when user clicks the login link sent by the bot
 */

// Import the session store from the webhook handler
// In production, use Redis or a database
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionToken = searchParams.get('token');

  if (!sessionToken) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=missing_token`);
  }

  try {
    // Get session data
    const sessionData = globalThis.telegramLoginSessions.get(sessionToken);

    if (!sessionData) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_or_expired_token`);
    }

    // Check if token is expired (10 minutes)
    const now = Date.now();
    if (now - sessionData.timestamp > 10 * 60 * 1000) {
      globalThis.telegramLoginSessions.delete(sessionToken);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=token_expired`);
    }

    // Find or get user from database
    const user = await findUserByTelegramId(sessionData.telegramId);

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=user_not_found&telegram_id=${sessionData.telegramId}`,
      );
    }

    // Set session cookie
    const userForSession = {
      ...user,
      role: user.role as 'CUSTOMER' | 'ADMIN',
      authProvider: (user.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
      telegramId: user.telegramId ?? undefined,
      whatsappPhone: user.whatsappPhone ?? undefined,
      avatar: user.avatar ?? undefined,
    };
    await setSessionCookie(userForSession);

    // Clean up the session token
    globalThis.telegramLoginSessions.delete(sessionToken);

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?login=success`);
  } catch (error) {
    console.error('Error verifying login token:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=login_failed`);
  }
}

/**
 * API Route: /api/auth/telegram/claim-session
 *
 * Called by the original browser to claim a completed login session.
 * This sets the session cookie in the original browser (not Telegram's in-app browser).
 */
import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/secureSession';
import { findUserById } from '@/lib/database';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  console.log('[CLAIM-SESSION] Starting session claim process');

  try {
    const body = await request.json();
    const { token } = body as { token: string };

    if (!token) {
      console.error('[CLAIM-SESSION] FAILED: No token provided');
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    console.log('[CLAIM-SESSION] Token received (redacted):', token.substring(0, 10) + '...');

    const db = await getDb();

    // Find the token and verify it's in COMPLETED status
    const tokenResults = await db
      .select()
      .from(schema.loginTokens)
      .where(and(eq(schema.loginTokens.token, token), eq(schema.loginTokens.status, 'COMPLETED')))
      .limit(1);

    const tokenData = tokenResults[0];

    if (!tokenData) {
      console.error('[CLAIM-SESSION] FAILED: Token not found or not in COMPLETED status');
      return NextResponse.json({ error: 'Invalid or unclaimed token' }, { status: 400 });
    }

    // Check expiry
    if (tokenData.expiresAt.getTime() < Date.now()) {
      console.error('[CLAIM-SESSION] FAILED: Token expired');
      await db.delete(schema.loginTokens).where(eq(schema.loginTokens.id, tokenData.id));
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    // Ensure userId exists
    if (!tokenData.userId) {
      console.error('[CLAIM-SESSION] FAILED: Token has no userId');
      return NextResponse.json({ error: 'User not linked to token' }, { status: 400 });
    }

    // Find the user
    const user = await findUserById(tokenData.userId);

    if (!user) {
      console.error('[CLAIM-SESSION] FAILED: User not found:', tokenData.userId);
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    console.log('[CLAIM-SESSION] User found:', {
      id: user.id,
      name: user.name,
      authProvider: user.authProvider,
    });

    // Set the session cookie in the ORIGINAL browser
    const userForSession = {
      ...user,
      role: user.role as 'CUSTOMER' | 'ADMIN',
      authProvider: (user.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
      telegramId: user.telegramId ?? undefined,
      whatsappPhone: user.whatsappPhone ?? undefined,
      avatar: user.avatar ?? undefined,
    };

    console.log('[CLAIM-SESSION] Setting session cookie...');
    await setSessionCookie(userForSession);

    // Delete the used token
    console.log('[CLAIM-SESSION] Deleting used token...');
    await db.delete(schema.loginTokens).where(eq(schema.loginTokens.id, tokenData.id));

    console.log('[CLAIM-SESSION] SUCCESS: Session claimed by original browser');
    return NextResponse.json({ success: true, user: { id: user.id, name: user.name } });
  } catch (error) {
    console.error('[CLAIM-SESSION] EXCEPTION:', error);
    return NextResponse.json({ error: 'Failed to claim session' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/secureSession';
import { findUserById } from '@/lib/database';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionToken = searchParams.get('token');

  console.log('[VERIFY-LOGIN] Starting verification process');

  // Check if this is Telegram's link preview bot
  const userAgent = request.headers.get('user-agent') || '';
  const isTelegramBot = userAgent.includes('TelegramBot');

  console.log('[VERIFY-LOGIN] User-Agent:', userAgent);
  console.log('[VERIFY-LOGIN] Is Telegram Bot:', isTelegramBot);

  if (isTelegramBot) {
    console.log('[VERIFY-LOGIN] Telegram preview bot detected - returning simple success page');
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <title>Complete Your Login</title>
  <meta property="og:title" content="Complete Your Login to Signature Trims" />
  <meta property="og:description" content="Click to complete your Telegram login" />
</head>
<body>
  <h1>Click to complete your login</h1>
</body>
</html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      },
    );
  }

  if (!sessionToken) {
    console.error('[VERIFY-LOGIN] FAILED: Token parameter missing from URL');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=missing_token`);
  }

  console.log('[VERIFY-LOGIN] Token received (redacted):', sessionToken.substring(0, 10) + '...');
  console.log('[VERIFY-LOGIN] Token full length:', sessionToken.length);

  try {
    const db = await getDb();
    console.log('[VERIFY-LOGIN] Querying database for token...');

    // Query all tokens to see what's in the database
    const allTokens = await db
      .select({
        id: schema.loginTokens.id,
        token: schema.loginTokens.token,
        userId: schema.loginTokens.userId,
        expiresAt: schema.loginTokens.expiresAt,
        createdAt: schema.loginTokens.createdAt,
      })
      .from(schema.loginTokens);

    console.log('[VERIFY-LOGIN] Total tokens in database:', allTokens.length);
    console.log(
      '[VERIFY-LOGIN] Token prefixes:',
      allTokens.map(t => ({
        prefix: t.token.substring(0, 10) + '...',
        userId: t.userId,
        expired: t.expiresAt < new Date(),
      })),
    );

    const tokenResults = await db
      .select()
      .from(schema.loginTokens)
      .where(eq(schema.loginTokens.token, sessionToken))
      .limit(1);
    const tokenData = tokenResults[0];

    if (!tokenData) {
      console.error('[VERIFY-LOGIN] FAILED: Token not found in database');
      console.error('[VERIFY-LOGIN] Searched for token:', sessionToken.substring(0, 10) + '...');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_or_expired_token`);
    }

    console.log('[VERIFY-LOGIN] Token found in database, checking expiry...');
    console.log('[VERIFY-LOGIN] Token expires at:', tokenData.expiresAt);
    console.log('[VERIFY-LOGIN] Current time:', new Date());

    if (tokenData.expiresAt.getTime() < Date.now()) {
      console.error('[VERIFY-LOGIN] FAILED: Token expired');
      await db.delete(schema.loginTokens).where(eq(schema.loginTokens.id, tokenData.id));
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=token_expired`);
    }

    console.log('[VERIFY-LOGIN] Token not expired, checking userId...');

    if (!tokenData.userId) {
      console.error(
        '[VERIFY-LOGIN] FAILED: Token has no userId attached (webhook may have failed to update)',
      );
      console.error('[VERIFY-LOGIN] Token data:', {
        id: tokenData.id,
        createdAt: tokenData.createdAt,
        expiresAt: tokenData.expiresAt,
      });
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=user_not_found`);
    }

    console.log('[VERIFY-LOGIN] UserId found:', tokenData.userId);
    console.log('[VERIFY-LOGIN] Looking up user in database...');

    const user = await findUserById(tokenData.userId);

    if (!user) {
      console.error('[VERIFY-LOGIN] FAILED: UserId exists on token but user not found in database');
      console.error('[VERIFY-LOGIN] UserId:', tokenData.userId);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=user_not_found`);
    }

    console.log('[VERIFY-LOGIN] User found:', {
      id: user.id,
      name: user.name,
      authProvider: user.authProvider,
    });

    const userForSession = {
      ...user,
      role: user.role as 'CUSTOMER' | 'ADMIN',
      authProvider: (user.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
      telegramId: user.telegramId ?? undefined,
      whatsappPhone: user.whatsappPhone ?? undefined,
      avatar: user.avatar ?? undefined,
    };

    console.log('[VERIFY-LOGIN] Setting session cookie...');
    await setSessionCookie(userForSession);

    console.log('[VERIFY-LOGIN] Deleting used token...');
    await db.delete(schema.loginTokens).where(eq(schema.loginTokens.id, tokenData.id));

    console.log('[VERIFY-LOGIN] SUCCESS: Redirecting to app with login=success');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?login=success`);
  } catch (error) {
    console.error('[VERIFY-LOGIN] EXCEPTION during verification:', error);
    console.error('[VERIFY-LOGIN] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=login_failed`);
  }
}

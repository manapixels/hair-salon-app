import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/secureSession';
import { findUserById } from '@/lib/database';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionToken = searchParams.get('token');

  console.log('[VERIFY-LOGIN] Starting verification process');

  if (!sessionToken) {
    console.error('[VERIFY-LOGIN] FAILED: Token parameter missing from URL');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=missing_token`);
  }

  console.log('[VERIFY-LOGIN] Token received (redacted):', sessionToken.substring(0, 10) + '...');

  try {
    const tokenData = await prisma.loginToken.findUnique({
      where: { token: sessionToken },
    });

    if (!tokenData) {
      console.error('[VERIFY-LOGIN] FAILED: Token not found in database');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_or_expired_token`);
    }

    console.log('[VERIFY-LOGIN] Token found in database, checking expiry...');
    console.log('[VERIFY-LOGIN] Token expires at:', tokenData.expiresAt);
    console.log('[VERIFY-LOGIN] Current time:', new Date());

    if (tokenData.expiresAt.getTime() < Date.now()) {
      console.error('[VERIFY-LOGIN] FAILED: Token expired');
      await prisma.loginToken.delete({ where: { id: tokenData.id } });
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
    await prisma.loginToken.delete({ where: { id: tokenData.id } });

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

import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/secureSession';
import { findUserById } from '@/lib/database';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionToken = searchParams.get('token');

  if (!sessionToken) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=missing_token`);
  }

  try {
    const tokenData = await prisma.loginToken.findUnique({
      where: { token: sessionToken },
    });

    if (!tokenData) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_or_expired_token`);
    }

    if (tokenData.expiresAt.getTime() < Date.now()) {
      await prisma.loginToken.delete({ where: { id: tokenData.id } });
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=token_expired`);
    }

    if (!tokenData.userId) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=user_not_found`);
    }

    const user = await findUserById(tokenData.userId);

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=user_not_found`);
    }

    const userForSession = {
      ...user,
      role: user.role as 'CUSTOMER' | 'ADMIN',
      authProvider: (user.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
      telegramId: user.telegramId ?? undefined,
      whatsappPhone: user.whatsappPhone ?? undefined,
      avatar: user.avatar ?? undefined,
    };
    await setSessionCookie(userForSession);

    await prisma.loginToken.delete({ where: { id: tokenData.id } });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?login=success`);
  } catch (error) {
    console.error('Error verifying login token:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=login_failed`);
  }
}

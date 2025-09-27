import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac } from 'crypto';
import { setSession } from '@/lib/sessionStore';
import { prisma } from '@/lib/prisma';
import type { User } from '@/types';

// Handle Telegram Login Widget callback
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Extract Telegram auth data from URL parameters
  const authData = {
    id: parseInt(searchParams.get('id') || '0'),
    first_name: searchParams.get('first_name') || '',
    last_name: searchParams.get('last_name') || '',
    username: searchParams.get('username') || '',
    photo_url: searchParams.get('photo_url') || '',
    auth_date: parseInt(searchParams.get('auth_date') || '0'),
    hash: searchParams.get('hash') || '',
  };

  // Validate required fields
  if (!authData.id || !authData.first_name || !authData.hash || !authData.auth_date) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_telegram_data`);
  }

  // Check auth data age (should be recent)
  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime - authData.auth_date > 86400) {
    // 24 hours
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=telegram_data_expired`);
  }

  try {
    // Verify auth data integrity
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('Telegram bot token not configured');
    }

    if (!verifyTelegramAuth(authData, botToken)) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_telegram_auth`);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId: authData.id },
    });

    const fullName = authData.last_name
      ? `${authData.first_name} ${authData.last_name}`
      : authData.first_name;
    const email = authData.username
      ? `${authData.username}@telegram.local`
      : `${authData.id}@telegram.local`;

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          id: `tg_${authData.id}`,
          name: fullName,
          email,
          role: 'CUSTOMER',
          authProvider: 'telegram',
          telegramId: authData.id,
          avatar: authData.photo_url || undefined,
          password: 'oauth_user',
        },
      });
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: fullName,
          authProvider: 'telegram',
          telegramId: authData.id,
          avatar: authData.photo_url || undefined,
        },
      });
    }

    // Set session with proper role conversion
    const userForSession = {
      ...user,
      role: user.role.toLowerCase() as 'customer' | 'admin',
      authProvider: (user.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
      telegramId: user.telegramId ?? undefined,
      whatsappPhone: user.whatsappPhone ?? undefined,
      avatar: user.avatar ?? undefined,
    };
    setSession(userForSession);

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?login=success`);
  } catch (error) {
    console.error('Telegram auth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=telegram_auth_failed`);
  }
}

function verifyTelegramAuth(authData: { [key: string]: any }, botToken: string): boolean {
  const { hash, ...dataToCheck } = authData;

  // Create data check string
  const dataCheckString = Object.keys(dataToCheck)
    .filter(key => dataToCheck[key] !== '' && dataToCheck[key] !== 0)
    .sort()
    .map(key => `${key}=${dataToCheck[key]}`)
    .join('\n');

  // Create secret key
  const secretKey = createHash('sha256').update(botToken).digest();

  // Calculate HMAC
  const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return calculatedHash === hash;
}

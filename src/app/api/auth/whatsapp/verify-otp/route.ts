import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/secureSession';
import { createUserFromOAuth } from '@/lib/database';

// WhatsApp OTP verification endpoint
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp, name } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        {
          error: 'Phone number and OTP are required',
        },
        { status: 400 },
      );
    }

    // Get stored OTP data
    globalThis.otpStore = globalThis.otpStore || new Map();
    const otpData = globalThis.otpStore.get(phoneNumber);

    if (!otpData) {
      return NextResponse.json(
        {
          error: 'OTP not found or expired. Please request a new one.',
        },
        { status: 400 },
      );
    }

    // Check if OTP is expired
    if (new Date() > otpData.expiresAt) {
      globalThis.otpStore?.delete(phoneNumber);
      return NextResponse.json(
        {
          error: 'OTP has expired. Please request a new one.',
        },
        { status: 400 },
      );
    }

    // Check attempt limit (max 3 attempts)
    if (otpData.attempts >= 3) {
      globalThis.otpStore?.delete(phoneNumber);
      return NextResponse.json(
        {
          error: 'Too many failed attempts. Please request a new OTP.',
        },
        { status: 400 },
      );
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      // Increment attempt count
      otpData.attempts += 1;
      globalThis.otpStore?.set(phoneNumber, otpData);

      return NextResponse.json(
        {
          error: `Invalid OTP. ${3 - otpData.attempts} attempts remaining.`,
        },
        { status: 400 },
      );
    }

    // OTP is valid - clean up
    globalThis.otpStore?.delete(phoneNumber);

    // Create or update user
    const userData = {
      name: name || `WhatsApp User ${phoneNumber.slice(-4)}`,
      email: `${phoneNumber.replace('+', '')}@whatsapp.local`,
      authProvider: 'whatsapp' as const,
      whatsappPhone: phoneNumber,
    };

    const user = await createUserFromOAuth(userData);

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

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        whatsappPhone: user.whatsappPhone,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

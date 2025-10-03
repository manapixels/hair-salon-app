import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/services/messagingService';

// WhatsApp OTP request endpoint
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        {
          error: 'Invalid phone number format. Please include country code (e.g., +1234567890)',
        },
        { status: 400 },
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in memory/database with expiration (10 minutes)
    const otpData = {
      phoneNumber,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      attempts: 0,
    };

    // Store in memory for now (in production, use Redis/database)
    globalThis.otpStore = globalThis.otpStore || new Map();
    globalThis.otpStore.set(phoneNumber, otpData);

    // Send OTP via WhatsApp
    const message = `🔐 Your Luxe Cuts verification code is: *${otp}*

This code expires in 10 minutes. Don't share this code with anyone.

If you didn't request this code, please ignore this message.`;

    try {
      const messageSent = await sendWhatsAppMessage(phoneNumber, message);

      // Production: Fail if WhatsApp doesn't work
      if (!messageSent && process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          {
            error:
              'Unable to send verification code. WhatsApp service is currently unavailable. Please try again later or contact support.',
          },
          { status: 503 },
        );
      }

      // Development: Allow fallback
      if (!messageSent) {
        console.log(`🔐 Development OTP for ${phoneNumber}: ${otp}`);
      }

      return NextResponse.json({
        success: true,
        message: messageSent
          ? 'OTP sent successfully via WhatsApp'
          : 'Development mode: OTP generated (WhatsApp unavailable)',
        expiresIn: 600, // 10 minutes in seconds
        // Include OTP in response for development/testing only
        ...(process.env.NODE_ENV === 'development' &&
          !messageSent && {
            testOtp: otp,
            note: 'Development mode - WhatsApp unavailable. Use testOtp field or check server console.',
          }),
      });
    } catch (error) {
      console.error('Failed to send WhatsApp OTP:', error);

      // Production: Fail hard
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please try again later.' },
          { status: 503 },
        );
      }

      // Development: Allow fallback
      console.log(`🔐 Development OTP for ${phoneNumber}: ${otp} (WhatsApp failed)`);

      return NextResponse.json({
        success: true,
        message: 'Development mode: WhatsApp failed',
        expiresIn: 600,
        testOtp: otp,
        note: 'Development mode - WhatsApp service error. Use testOtp field.',
      });
    }
  } catch (error) {
    console.error('OTP request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

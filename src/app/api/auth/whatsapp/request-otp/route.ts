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

      // For development/testing, allow login even if WhatsApp fails
      // In production, you might want to make this stricter
      return NextResponse.json({
        success: true,
        message: messageSent
          ? 'OTP sent successfully via WhatsApp'
          : 'OTP generated (WhatsApp sending temporarily disabled)',
        expiresIn: 600, // 10 minutes in seconds
        // Include OTP in response for testing when WhatsApp fails (remove in production)
        ...(!messageSent &&
          process.env.NODE_ENV === 'development' && {
            testOtp: otp,
            note: 'Check console for OTP or use testOtp field',
          }),
      });
    } catch (error) {
      console.error('Failed to send WhatsApp OTP:', error);

      // Don't fail the entire request - allow authentication to continue
      console.log(`🔐 OTP for ${phoneNumber}: ${otp} (WhatsApp failed, using fallback)`);

      return NextResponse.json({
        success: true,
        message: 'OTP generated (WhatsApp temporarily unavailable)',
        expiresIn: 600,
        ...(process.env.NODE_ENV === 'development' && {
          testOtp: otp,
          note: 'WhatsApp failed - check console or use testOtp field',
        }),
      });
    }
  } catch (error) {
    console.error('OTP request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

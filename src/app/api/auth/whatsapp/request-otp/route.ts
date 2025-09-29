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
      await sendWhatsAppMessage(phoneNumber, message);

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 600, // 10 minutes in seconds
      });
    } catch (error) {
      console.error('Failed to send WhatsApp OTP:', error);

      // Clean up stored OTP if sending failed
      globalThis.otpStore?.delete(phoneNumber);

      return NextResponse.json(
        {
          error: 'Failed to send OTP. Please check your phone number and try again.',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('OTP request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

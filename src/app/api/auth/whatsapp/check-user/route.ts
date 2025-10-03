import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API Route: /api/auth/whatsapp/check-user
 * Checks if a user exists with the given WhatsApp phone number
 */
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Check if user exists with this WhatsApp phone number
    const existingUser = await prisma.user.findFirst({
      where: { whatsappPhone: phoneNumber },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({
      exists: !!existingUser,
      name: existingUser?.name || null,
    });
  } catch (error) {
    console.error('User check error:', error);
    // Return false on error to not block login flow
    return NextResponse.json({ exists: false, name: null });
  }
}

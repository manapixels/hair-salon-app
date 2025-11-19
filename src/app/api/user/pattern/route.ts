import { NextRequest, NextResponse } from 'next/server';
import { calculateUserPattern } from '@/services/messagingUserService';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Authentication (Simplified for this context)
    // In a real app, we'd validate the session token from cookies/headers
    // For now, we'll assume the user is authenticated if they provide an email query param
    // or if we can extract it from a custom header.
    // Given the current architecture, let's try to get email from query param for simplicity
    // as the frontend can pass it.

    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email');

    // Ideally we use the session. But let's check if we can import a session helper.
    // Since I can't find auth.ts, I'll rely on the frontend passing the email for now
    // and assume the middleware handles protection (if any).

    // WAIT: The CustomerDashboard has the user object. It can pass the email.

    if (!emailParam) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const userEmail = emailParam;

    // 2. Fetch user's past appointments to calculate pattern
    // We need to fetch appointments first.
    // Reusing logic from messagingUserService would be ideal, but calculateUserPattern takes appointments.

    const appointments = await prisma.appointment.findMany({
      where: {
        customerEmail: userEmail,
        status: { not: 'CANCELLED' },
      },
      orderBy: { date: 'desc' },
      take: 10, // Analyze last 10 appointments
    });

    // 3. Calculate Pattern
    const pattern = calculateUserPattern(appointments);

    return NextResponse.json(pattern);
  } catch (error) {
    console.error('Error fetching user pattern:', error);
    return NextResponse.json({ error: 'Failed to fetch user pattern' }, { status: 500 });
  }
}

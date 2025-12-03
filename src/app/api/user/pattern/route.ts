import { NextRequest, NextResponse } from 'next/server';
import { calculateUserPattern } from '@/services/messagingUserService';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/sessionMiddleware';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    console.log('[/api/user/pattern] Fetching pattern for user:', user.id);

    // Fetch user's past appointments to calculate pattern
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: user.id, // Use user.id from session instead of email
        status: { not: 'CANCELLED' },
      },
      orderBy: { date: 'desc' },
      take: 10, // Analyze last 10 appointments
    });

    console.log(
      `[/api/user/pattern] Found ${appointments.length} appointments for pattern calculation`,
    );

    // Calculate Pattern
    const pattern = calculateUserPattern(appointments);

    return NextResponse.json(pattern);
  } catch (error) {
    console.error('[/api/user/pattern] Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: user.id,
    });
    return NextResponse.json({ error: 'Failed to fetch user pattern' }, { status: 500 });
  }
});

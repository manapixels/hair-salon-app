import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/sessionMiddleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count upcoming appointments (today and future)
    const count = await prisma.appointment.count({
      where: {
        userId: user.id,
        date: {
          gte: today,
        },
      },
    });

    // Get next appointment details (optional, for future tooltip enhancement)
    const nextAppointment = await prisma.appointment.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: today,
        },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      select: {
        date: true,
        time: true,
      },
    });

    return NextResponse.json(
      {
        count,
        nextAppointment: nextAppointment
          ? {
              date: nextAppointment.date.toISOString().split('T')[0],
              time: nextAppointment.time,
            }
          : null,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        },
      },
    );
  } catch (error) {
    console.error('Error fetching appointment count:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment count' }, { status: 500 });
  }
});

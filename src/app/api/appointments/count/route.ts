import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/sessionMiddleware';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, gte, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const db = await getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count upcoming appointments (today and future)
    const appointments = await db
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.userId, user.id));

    const upcomingAppointments = appointments.filter(a => a.date >= today);
    const count = upcomingAppointments.length;

    // Get next appointment details
    const sortedAppointments = upcomingAppointments.sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) {
        return a.date.getTime() - b.date.getTime();
      }
      return a.time.localeCompare(b.time);
    });

    const nextAppointment = sortedAppointments[0] || null;

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
          'Cache-Control': 'private, max-age=300',
        },
      },
    );
  } catch (error) {
    console.error('Error fetching appointment count:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment count' }, { status: 500 });
  }
});

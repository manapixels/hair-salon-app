import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/sessionMiddleware';
import { getUserAppointments } from '@/lib/database';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    // Get user appointments
    const appointments = await getUserAppointments(user.id);

    return NextResponse.json(appointments, { status: 200 });
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
});

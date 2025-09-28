import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/sessionStore';
import { getUserAppointments } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user appointments
    const appointments = await getUserAppointments(session.id);

    return NextResponse.json(appointments, { status: 200 });
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/sessionMiddleware';
import { getUserAppointments } from '@/lib/database';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    // Validate user.id exists
    if (!user || !user.id) {
      console.error('[/api/appointments/user] User ID is missing from session:', user);
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    console.log('[/api/appointments/user] Fetching appointments for user:', user.id);

    let appointments;
    try {
      appointments = await getUserAppointments(user.id);
    } catch (dbError) {
      console.error('[/api/appointments/user] Database error:', {
        error: dbError,
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : undefined,
        userId: user.id,
      });

      if (dbError instanceof Error && dbError.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Database connection failed. Please try again later.' },
          { status: 503 },
        );
      }

      throw dbError; // Re-throw to be caught by outer catch
    }

    console.log(`[/api/appointments/user] Found ${appointments.length} appointments`);

    return NextResponse.json(appointments, { status: 200 });
  } catch (error) {
    console.error('[/api/appointments/user] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      user: { id: user?.id, email: user?.email },
    });
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
});

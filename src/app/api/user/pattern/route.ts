import { NextRequest, NextResponse } from 'next/server';
import { calculateUserPattern } from '@/services/messagingUserService';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, not, desc } from 'drizzle-orm';
import { withAuth } from '@/lib/sessionMiddleware';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    console.log('[/api/user/pattern] Fetching pattern for user:', user.id);

    const db = await getDb();

    // Fetch user's past appointments to calculate pattern
    const allAppointments = await db
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.userId, user.id))
      .orderBy(desc(schema.appointments.date))
      .limit(10);

    // Filter out cancelled appointments
    const appointments = allAppointments.filter(a => a.status !== 'CANCELLED');

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

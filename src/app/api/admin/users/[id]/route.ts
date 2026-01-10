/**
 * API Route: /api/admin/users/[id]
 * Delete a user and their associated data (appointments, calendar events)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { deleteCalendarEvent } from '@/lib/google';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user and sync calendar event deletions
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: userId } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const db = await getDb();

  try {
    // 1. Get user to verify they exist
    const userResult = await db
      .select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Get all appointments with calendar events that need to be removed
    const appointmentsWithCalendarEvents = await db
      .select({
        id: schema.appointments.id,
        calendarEventId: schema.appointments.calendarEventId,
        stylistId: schema.appointments.stylistId,
      })
      .from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.userId, userId),
          // Only get appointments with calendar events
          // Using a workaround since we can't do isNotNull in simple select
        ),
      );

    // Filter to only those with calendar events
    const appointmentsToSync = appointmentsWithCalendarEvents.filter(apt => apt.calendarEventId);

    // 3. Delete calendar events from Google Calendar
    const calendarDeletionResults = await Promise.allSettled(
      appointmentsToSync.map(async apt => {
        if (apt.calendarEventId) {
          await deleteCalendarEvent(apt.calendarEventId, apt.stylistId);
          console.log(`[UserDelete] Removed calendar event ${apt.calendarEventId}`);
        }
      }),
    );

    // Log any calendar deletion failures (non-blocking)
    const failedDeletions = calendarDeletionResults.filter(result => result.status === 'rejected');
    if (failedDeletions.length > 0) {
      console.warn(
        `[UserDelete] ${failedDeletions.length} calendar events failed to delete (continuing anyway)`,
      );
    }

    // 4. Delete the user (appointments will cascade delete due to schema)
    await db.delete(schema.users).where(eq(schema.users.id, userId));

    console.log(
      `[UserDelete] Deleted user ${userId} with ${appointmentsToSync.length} calendar events synced`,
    );

    return NextResponse.json({
      success: true,
      deletedUserId: userId,
      appointmentsDeleted: appointmentsWithCalendarEvents.length,
      calendarEventsSynced: appointmentsToSync.length,
    });
  } catch (error: any) {
    console.error('[UserDelete] Error deleting user:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}

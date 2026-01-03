import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/secureSession';
import { getStylistByUserId } from '@/lib/database';
import { hasStylistAccess } from '@/lib/roleHelpers';
import { createCalendarEvent } from '@/lib/google';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, isNull, gte, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stylists/me/sync-calendar
 * Manually trigger calendar sync for the logged-in stylist's appointments
 */
export async function POST() {
  try {
    // 1. Verify user is logged in and has stylist access
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasStylistAccess(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Get stylist profile
    const stylist = await getStylistByUserId(user.id);
    if (!stylist) {
      return NextResponse.json({ error: 'Stylist profile not found' }, { status: 404 });
    }

    // 3. Check if calendar is connected
    if (!stylist.googleRefreshToken) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // 4. Find unsynced appointments for this stylist
    const db = await getDb();
    const now = new Date();

    const unsyncedAppointments = await db
      .select()
      .from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.stylistId, stylist.id),
          isNull(schema.appointments.calendarEventId),
          gte(schema.appointments.date, now), // Only future appointments
        ),
      );

    if (unsyncedAppointments.length === 0) {
      return NextResponse.json({
        message: 'All appointments are already synced',
        syncedCount: 0,
        failedCount: 0,
      });
    }

    // 5. Sync each appointment
    let syncedCount = 0;
    let failedCount = 0;

    for (const appt of unsyncedAppointments) {
      try {
        // Build appointment object with required fields
        const appointment = {
          id: appt.id,
          date: new Date(appt.date),
          time: appt.time,
          customerName: appt.customerName,
          customerEmail: appt.customerEmail,
          services: Array.isArray(appt.services) ? appt.services : [],
          totalPrice: appt.totalPrice,
          totalDuration: appt.totalDuration,
          stylistId: appt.stylistId,
          stylist: { id: stylist.id, name: stylist.name, email: stylist.email },
          createdAt: appt.createdAt,
          updatedAt: appt.updatedAt,
        };

        const eventId = await createCalendarEvent(appointment as any);

        if (eventId) {
          // Update the appointment with the calendar event ID
          await db
            .update(schema.appointments)
            .set({ calendarEventId: eventId, updatedAt: new Date() })
            .where(eq(schema.appointments.id, appt.id));
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Failed to sync appointment ${appt.id}:`, error);
        failedCount++;
      }
    }

    return NextResponse.json({
      message: `Sync complete`,
      syncedCount,
      failedCount,
      totalFound: unsyncedAppointments.length,
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json({ error: 'Failed to sync calendar' }, { status: 500 });
  }
}

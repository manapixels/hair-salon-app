/**
 * API Route: /api/appointments/mark-no-show
 *
 * Marks completed appointments as no-shows and reverses user stats
 * Admin-only endpoint
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/sessionMiddleware';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const db = await getDb();
    const body = (await request.json()) as { appointmentId: string };
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json({ message: 'Appointment ID is required' }, { status: 400 });
    }

    // Get the appointment
    const appointments = await db
      .select({
        id: schema.appointments.id,
        status: schema.appointments.status,
        userId: schema.appointments.userId,
        completedAt: schema.appointments.completedAt,
      })
      .from(schema.appointments)
      .where(eq(schema.appointments.id, appointmentId))
      .limit(1);

    const appointment = appointments[0];

    if (!appointment) {
      return NextResponse.json({ message: 'Appointment not found' }, { status: 404 });
    }

    // Only allow marking COMPLETED appointments as no-shows
    if (appointment.status !== 'COMPLETED') {
      return NextResponse.json(
        { message: 'Only completed appointments can be marked as no-shows' },
        { status: 400 },
      );
    }

    if (!appointment.userId) {
      // Guest booking, just update status
      await db
        .update(schema.appointments)
        .set({ status: 'NO_SHOW', completedAt: null, updatedAt: new Date() })
        .where(eq(schema.appointments.id, appointmentId));

      return NextResponse.json({
        message: 'Appointment marked as no-show',
        appointmentId,
      });
    }

    // For user appointments, update stats (Drizzle doesn't have transactions with HTTP driver, so sequential ops)
    const userId = appointment.userId;

    // Update appointment status
    await db
      .update(schema.appointments)
      .set({ status: 'NO_SHOW', completedAt: null, updatedAt: new Date() })
      .where(eq(schema.appointments.id, appointmentId));

    // Get current user to decrement visits
    const userResult = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    const currentUser = userResult[0];

    if (currentUser) {
      // Decrement user's total visits
      await db
        .update(schema.users)
        .set({
          totalVisits: Math.max(0, (currentUser.totalVisits || 1) - 1),
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId));

      // Recalculate lastVisitDate from remaining COMPLETED appointments
      const completedAppointments = await db
        .select()
        .from(schema.appointments)
        .where(eq(schema.appointments.userId, userId))
        .orderBy(desc(schema.appointments.completedAt));

      const lastCompleted = completedAppointments.find(
        a => a.status === 'COMPLETED' && a.completedAt,
      );

      await db
        .update(schema.users)
        .set({ lastVisitDate: lastCompleted?.completedAt || null, updatedAt: new Date() })
        .where(eq(schema.users.id, userId));
    }

    return NextResponse.json({
      message: 'Appointment marked as no-show and user stats updated',
      appointmentId,
    });
  } catch (error) {
    console.error('Error marking appointment as no-show:', error);
    return NextResponse.json(
      {
        message: 'Failed to mark appointment as no-show',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
});

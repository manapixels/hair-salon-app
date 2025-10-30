/**
 * API Route: /api/appointments/mark-no-show
 *
 * Marks completed appointments as no-shows and reverses user stats
 * Admin-only endpoint
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/sessionMiddleware';
import { prisma } from '@/lib/prisma';

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json({ message: 'Appointment ID is required' }, { status: 400 });
    }

    // Get the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        status: true,
        userId: true,
        completedAt: true,
      },
    });

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
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'NO_SHOW',
          completedAt: null,
        },
      });

      return NextResponse.json({
        message: 'Appointment marked as no-show',
        appointmentId,
      });
    }

    // For user appointments, reverse the stats in a transaction
    const userId = appointment.userId; // userId is guaranteed to be string at this point
    await prisma.$transaction(async tx => {
      // Update appointment status
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'NO_SHOW',
          completedAt: null, // Clear completion timestamp
        },
      });

      // Decrement user's total visits
      await tx.user.update({
        where: { id: userId },
        data: {
          totalVisits: { decrement: 1 },
        },
      });

      // Recalculate lastVisitDate from remaining COMPLETED appointments
      const lastCompletedAppointment = await tx.appointment.findFirst({
        where: {
          userId: userId,
          status: 'COMPLETED',
        },
        orderBy: {
          completedAt: 'desc',
        },
        select: {
          completedAt: true,
        },
      });

      // Update lastVisitDate - set to the completedAt of last completed appointment, or null if none
      const newLastVisitDate = lastCompletedAppointment?.completedAt || null;
      await tx.user.update({
        where: { id: userId },
        data: {
          lastVisitDate: newLastVisitDate,
        },
      });
    });

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

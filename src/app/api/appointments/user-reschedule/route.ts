import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/sessionMiddleware';
import { getUserAppointmentById, rescheduleAppointment } from '@/lib/database';
import { updateCalendarEvent } from '@/lib/google';
import { sendAppointmentConfirmation } from '@/services/messagingService';

export const PATCH = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = (await request.json()) as {
      appointmentId: string;
      newDate: string;
      newTime: string;
    };
    const { appointmentId, newDate, newTime } = body;

    if (!appointmentId || !newDate || !newTime) {
      return NextResponse.json(
        {
          error: 'Appointment ID, new date, and new time are required',
        },
        { status: 400 },
      );
    }

    // Verify the appointment belongs to the user
    const appointment = await getUserAppointmentById(appointmentId, user.id);
    if (!appointment) {
      return NextResponse.json(
        {
          error: 'Appointment not found or access denied',
        },
        { status: 404 },
      );
    }

    // Reschedule the appointment
    const updatedAppointment = await rescheduleAppointment(
      appointmentId,
      new Date(newDate),
      newTime,
    );

    // Update Google Calendar event if exists
    if (updatedAppointment.calendarEventId) {
      try {
        await updateCalendarEvent(updatedAppointment.calendarEventId, updatedAppointment);
        console.log(`📅 Calendar event updated for rescheduled appointment ${appointmentId}`);
      } catch (error) {
        console.error('Failed to update calendar event:', error);
        // Don't fail the reschedule if calendar update fails
      }
    }

    // Send reschedule notification
    try {
      await sendAppointmentConfirmation(
        updatedAppointment.user || null,
        updatedAppointment,
        'reschedule',
      );
      console.log(`✅ Reschedule confirmation sent to ${updatedAppointment.customerEmail}`);
    } catch (error) {
      console.error('Failed to send reschedule notification:', error);
      // Don't fail the reschedule if messaging fails
    }

    return NextResponse.json(
      {
        message: 'Appointment rescheduled successfully',
        appointment: updatedAppointment,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error rescheduling appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reschedule appointment' },
      { status: 500 },
    );
  }
});

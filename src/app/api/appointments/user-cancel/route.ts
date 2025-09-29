import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/sessionMiddleware';
import { getUserAppointmentById, deleteAppointment } from '@/lib/database';
import { deleteCalendarEvent } from '@/lib/google';
import { sendAppointmentCancellation } from '@/services/messagingService';

export const DELETE = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    // Get the appointment first to verify ownership
    const appointment = await getUserAppointmentById(appointmentId, user.id);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found or access denied' },
        { status: 404 },
      );
    }

    // Delete the appointment
    await deleteAppointment(appointmentId);

    // Delete the calendar event if it exists
    if (appointment.calendarEventId) {
      try {
        await deleteCalendarEvent(appointment.calendarEventId);
        console.log(`🗑️ Calendar event deleted for cancelled appointment`);
      } catch (error) {
        console.error('Failed to delete calendar event:', error);
        // Don't fail the cancellation if calendar deletion fails
      }
    }

    // Send cancellation notification
    try {
      const messageSent = await sendAppointmentCancellation(user, appointment);
      if (messageSent) {
        console.log(`✅ Cancellation notification sent to ${user.email}`);
      }
    } catch (error) {
      console.error('Failed to send cancellation notification:', error);
      // Don't fail the cancellation if messaging fails
    }

    return NextResponse.json(
      {
        message: 'Appointment cancelled successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
  }
});

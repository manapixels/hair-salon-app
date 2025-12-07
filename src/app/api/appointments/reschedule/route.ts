/**
 * API Route: /api/appointments/reschedule
 *
 * Handles appointment rescheduling with validation and calendar updates
 */
import { NextRequest, NextResponse } from 'next/server';
import { rescheduleAppointment, findUserByEmail } from '../../../../lib/database';
import { updateCalendarEvent } from '../../../../lib/google';
import { sendAppointmentConfirmation } from '../../../../services/messagingService';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      appointmentId: string;
      newDate: string;
      newTime: string;
      customerEmail?: string;
    };
    const { appointmentId, newDate, newTime, customerEmail } = body;

    if (!appointmentId || !newDate || !newTime) {
      return NextResponse.json(
        {
          message: 'Missing required data: appointmentId, newDate, and newTime are required.',
        },
        { status: 400 },
      );
    }

    // Reschedule the appointment
    const rescheduledAppointment = await rescheduleAppointment(
      appointmentId,
      new Date(newDate),
      newTime,
    );

    // Update Google Calendar event if it exists
    if (rescheduledAppointment.calendarEventId) {
      try {
        await updateCalendarEvent(rescheduledAppointment.calendarEventId, rescheduledAppointment);
        console.log(`📅 Calendar event updated for rescheduled appointment ${appointmentId}`);
      } catch (error) {
        console.error('Failed to update calendar event:', error);
        // Don't fail the reschedule if calendar update fails
      }
    }

    // Send confirmation notification
    try {
      const dbUser = customerEmail ? await findUserByEmail(customerEmail) : null;
      let user = null;
      if (dbUser) {
        user = {
          ...dbUser,
          role: dbUser.role as 'CUSTOMER' | 'ADMIN',
          authProvider: (dbUser.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
          telegramId: dbUser.telegramId ?? undefined,
          whatsappPhone: dbUser.whatsappPhone ?? undefined,
          avatar: dbUser.avatar ?? undefined,
        };
      }

      const messageSent = await sendAppointmentConfirmation(
        user,
        rescheduledAppointment,
        'reschedule',
      );
      if (messageSent) {
        console.log(`✅ Reschedule confirmation sent to ${rescheduledAppointment.customerEmail}`);
      }
    } catch (error) {
      console.error('Failed to send reschedule notification:', error);
      // Don't fail the reschedule if messaging fails
    }

    return NextResponse.json(
      {
        message: 'Appointment rescheduled successfully',
        appointment: rescheduledAppointment,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error rescheduling appointment:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to reschedule appointment.' },
      { status: 400 },
    );
  }
}

/**
 * API Route: /api/appointments/cancel
 *
 * Handles appointment cancellations with notifications
 */
import { NextRequest, NextResponse } from 'next/server';
import { cancelAppointment, findUserByEmail } from '../../../../lib/database';
import { deleteCalendarEvent } from '../../../../lib/google';
import { sendAppointmentCancellation } from '../../../../services/messagingService';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { customerEmail: string; date: string; time: string };
    const { customerEmail, date, time } = body;

    if (!customerEmail || !date || !time) {
      return NextResponse.json(
        {
          message:
            'Missing required cancellation data: customerEmail, date, and time are required.',
        },
        { status: 400 },
      );
    }

    // Cancel the appointment in the database
    const cancelledAppointment = await cancelAppointment({
      customerEmail,
      date,
      time,
    });

    // Delete the calendar event if it exists
    if (cancelledAppointment.calendarEventId) {
      try {
        await deleteCalendarEvent(cancelledAppointment.calendarEventId);
        console.log(`🗑️ Calendar event deleted for cancelled appointment`);
      } catch (error) {
        console.error('Failed to delete calendar event:', error);
        // Don't fail the cancellation if calendar deletion fails
      }
    }

    // Send cancellation notification via WhatsApp/Telegram
    try {
      const dbUser = await findUserByEmail(cancelledAppointment.customerEmail);
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
      const messageSent = await sendAppointmentCancellation(user, cancelledAppointment);
      if (messageSent) {
        console.log(`✅ Cancellation notification sent to ${cancelledAppointment.customerEmail}`);
      }
    } catch (error) {
      console.error('Failed to send cancellation notification:', error);
      // Don't fail the cancellation if messaging fails
    }

    return NextResponse.json(
      {
        message: 'Appointment cancelled successfully',
        appointment: cancelledAppointment,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to cancel appointment.' },
      { status: 500 },
    );
  }
}

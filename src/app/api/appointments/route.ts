/**
 * API Route: /api/appointments
 *
 * App Router API handler for appointments
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  bookNewAppointment,
  getAppointments,
  updateAppointmentCalendarId,
  findUserByEmail,
} from '../../../lib/database';
import { createCalendarEvent } from '../../../lib/google';
import { sendAppointmentConfirmation } from '../../../services/messagingService';

export async function GET(request: NextRequest) {
  try {
    const appointments = await getAppointments();
    return NextResponse.json(appointments, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch appointments.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, time, services, stylistId, customerName, customerEmail } = body;

    if (!date || !time || !services || !customerName || !customerEmail) {
      return NextResponse.json({ message: 'Missing required appointment data.' }, { status: 400 });
    }

    // Look up user by email to link appointment to user account
    const existingUser = await findUserByEmail(customerEmail);

    const appointmentData = {
      date: new Date(date),
      time,
      services,
      stylistId,
      customerName,
      customerEmail,
      userId: existingUser?.id, // Link to user if they have an account
    };

    const newAppointment = await bookNewAppointment(appointmentData);

    // After successfully creating the appointment in our DB,
    // create a corresponding event in Google Calendar.
    const calendarEventId = await createCalendarEvent(newAppointment);

    // Update the appointment with the calendar event ID if successful
    if (calendarEventId) {
      await updateAppointmentCalendarId(newAppointment.id, calendarEventId);
      newAppointment.calendarEventId = calendarEventId;
    }

    // Send appointment confirmation via WhatsApp/Telegram
    try {
      let user = null;
      if (existingUser) {
        // Convert Prisma types to app types (user already looked up above)
        user = {
          ...existingUser,
          role: existingUser.role as 'CUSTOMER' | 'ADMIN',
          authProvider:
            (existingUser.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
          telegramId: existingUser.telegramId ?? undefined,
          whatsappPhone: existingUser.whatsappPhone ?? undefined,
          avatar: existingUser.avatar ?? undefined,
        };
      }
      const messageSent = await sendAppointmentConfirmation(user, newAppointment, 'confirmation');
      if (messageSent) {
        console.log(`✅ Appointment confirmation sent to ${newAppointment.customerEmail}`);
      }
    } catch (error) {
      console.error('Failed to send appointment confirmation:', error);
      // Don't fail the appointment creation if messaging fails
    }

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'An error occurred during booking.' },
      { status: 409 },
    );
  }
}

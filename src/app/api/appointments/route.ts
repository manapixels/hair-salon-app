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
    const appointments = getAppointments();
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
    const { date, time, services, customerName, customerEmail } = body;

    if (!date || !time || !services || !customerName || !customerEmail) {
      return NextResponse.json({ message: 'Missing required appointment data.' }, { status: 400 });
    }

    const appointmentData = {
      date: new Date(date),
      time,
      services,
      customerName,
      customerEmail,
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
      const dbUser = await findUserByEmail(newAppointment.customerEmail);
      let user = null;
      if (dbUser) {
        // Convert Prisma types to app types
        user = {
          ...dbUser,
          role: dbUser.role.toLowerCase() as 'customer' | 'admin',
          authProvider: (dbUser.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
          telegramId: dbUser.telegramId ?? undefined,
          whatsappPhone: dbUser.whatsappPhone ?? undefined,
          avatar: dbUser.avatar ?? undefined,
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

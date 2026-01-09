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
    const { searchParams } = new URL(request.url);
    const fromDateParam = searchParams.get('fromDate');
    const toDateParam = searchParams.get('toDate');

    const options: { fromDate?: Date; toDate?: Date } = {};

    if (fromDateParam) {
      options.fromDate = new Date(fromDateParam);
    }
    if (toDateParam) {
      options.toDate = new Date(toDateParam);
    }

    // If 'all' parameter is set, fetch all appointments (no date filter)
    const fetchAll = searchParams.get('all') === 'true';

    const appointments = fetchAll
      ? await getAppointments({ fromDate: new Date(0), toDate: new Date('2100-01-01') })
      : await getAppointments(options);

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
    const body = (await request.json()) as {
      date: string;
      time: string;
      services?: any[];
      stylistId?: string;
      customerName: string;
      customerEmail: string;
      categoryId?: string;
      estimatedDuration?: number;
    };
    const {
      date,
      time,
      services,
      stylistId,
      customerName,
      customerEmail,
      // Category-based booking fields
      categoryId,
      estimatedDuration,
    } = body;

    // Validate required fields (either category-based OR service-based)
    const hasCategory = Boolean(categoryId);
    const hasServices = Boolean(services && Array.isArray(services) && services.length > 0);

    if (!date || !time || !customerName || !customerEmail) {
      return NextResponse.json({ message: 'Missing required appointment data.' }, { status: 400 });
    }

    if (!hasCategory && !hasServices) {
      return NextResponse.json(
        { message: 'Either categoryId or services must be provided.' },
        { status: 400 },
      );
    }

    // Look up user by email to link appointment to user account
    const existingUser = await findUserByEmail(customerEmail);

    const appointmentData = {
      date: new Date(date),
      time,
      services: services || [], // Empty array for category-based booking
      stylistId,
      customerName,
      customerEmail,
      userId: existingUser?.id, // Link to user if they have an account
      bookingSource: 'WEB' as const,
      // Category-based fields (optional)
      categoryId,
      estimatedDuration,
    };

    const newAppointment = await bookNewAppointment(appointmentData);
    console.log(
      `[Appointment] Created appointment ${newAppointment.id} for ${newAppointment.customerName}`,
    );

    // After successfully creating the appointment in our DB,
    // create a corresponding event in Google Calendar.
    console.log(
      `[Appointment] Attempting Google Calendar sync for appointment ${newAppointment.id}...`,
    );
    const calendarEventId = await createCalendarEvent(newAppointment);

    // Update the appointment with the calendar event ID if successful
    if (calendarEventId) {
      await updateAppointmentCalendarId(newAppointment.id, calendarEventId);
      newAppointment.calendarEventId = calendarEventId;
      console.log(`[Appointment] ✅ Calendar event created: ${calendarEventId}`);
    } else {
      console.warn(
        `[Appointment] ⚠️ No calendar event created for appointment ${newAppointment.id}`,
      );
    }

    // Send appointment confirmation via WhatsApp/Telegram
    try {
      let user = null;
      if (existingUser) {
        user = {
          ...existingUser,
          roles: existingUser.roles as ('CUSTOMER' | 'STYLIST' | 'ADMIN')[],
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

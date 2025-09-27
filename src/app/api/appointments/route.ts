/**
 * API Route: /api/appointments
 *
 * App Router API handler for appointments
 */
import { NextRequest, NextResponse } from 'next/server';
import { bookNewAppointment, getAppointments } from '../../../lib/database';
import { createCalendarEvent } from '../../../lib/google';

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
    createCalendarEvent(newAppointment);

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'An error occurred during booking.' },
      { status: 409 },
    );
  }
}

// This is for compatibility with the mock API
export async function handleGet() {
  try {
    const appointments = getAppointments();
    return { status: 200, body: appointments };
  } catch (error: any) {
    return { status: 500, body: { message: error.message || 'Failed to fetch appointments.' } };
  }
}

export async function handlePost(requestBody: any) {
  if (!requestBody) {
    return { status: 400, body: { message: 'Bad Request: Missing request body.' } };
  }

  try {
    const { date, time, services, customerName, customerEmail } = requestBody;

    if (!date || !time || !services || !customerName || !customerEmail) {
      return { status: 400, body: { message: 'Missing required appointment data.' } };
    }

    const appointmentData = {
      date: new Date(date),
      time,
      services,
      customerName,
      customerEmail,
    };

    const newAppointment = await bookNewAppointment(appointmentData);
    createCalendarEvent(newAppointment);

    return { status: 201, body: newAppointment };
  } catch (error: any) {
    return { status: 409, body: { message: error.message || 'An error occurred during booking.' } };
  }
}

/**
 * API Route: /api/appointments/edit
 *
 * Handles appointment modifications with calendar and notification updates
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateAppointment, findAppointmentById, findUserByEmail } from '../../../../lib/database';
import { updateCalendarEvent } from '../../../../lib/google';
import { sendAppointmentConfirmation } from '../../../../services/messagingService';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, customerName, customerEmail, date, time, services } = body;

    if (!id || !customerName || !customerEmail || !date || !time || !services) {
      return NextResponse.json(
        {
          message:
            'Missing required appointment data: id, customerName, customerEmail, date, time, and services are required.',
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { message: 'At least one service must be selected.' },
        { status: 400 },
      );
    }

    // Get the current appointment to compare changes
    const currentAppointment = await findAppointmentById(id);
    if (!currentAppointment) {
      return NextResponse.json({ message: 'Appointment not found.' }, { status: 404 });
    }

    // Calculate totals
    const totalPrice = services.reduce((sum: number, service: any) => sum + service.price, 0);
    const totalDuration = services.reduce((sum: number, service: any) => sum + service.duration, 0);

    const appointmentData = {
      customerName,
      customerEmail,
      date: new Date(date),
      time,
      services,
      totalPrice,
      totalDuration,
    };

    // Update the appointment in the database
    const updatedAppointment = await updateAppointment(id, appointmentData);

    // Update the calendar event if it exists and the date/time changed
    const dateChanged =
      new Date(currentAppointment.date).toISOString() !== new Date(date).toISOString() ||
      currentAppointment.time !== time;

    const servicesChanged =
      JSON.stringify(currentAppointment.services) !== JSON.stringify(services);

    if (updatedAppointment.calendarEventId && (dateChanged || servicesChanged)) {
      try {
        await updateCalendarEvent(updatedAppointment.calendarEventId, updatedAppointment);
        console.log(`📅 Calendar event updated for appointment ${id}`);
      } catch (error) {
        console.error('Failed to update calendar event:', error);
        // Don't fail the appointment update if calendar update fails
      }
    }

    // Send notification if significant changes were made (date, time, or services)
    if (dateChanged || servicesChanged) {
      try {
        const dbUser = await findUserByEmail(updatedAppointment.customerEmail);
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
        const messageSent = await sendAppointmentConfirmation(
          user,
          updatedAppointment,
          'confirmation',
        );
        if (messageSent) {
          console.log(
            `✅ Appointment update notification sent to ${updatedAppointment.customerEmail}`,
          );
        }
      } catch (error) {
        console.error('Failed to send appointment update notification:', error);
        // Don't fail the appointment update if messaging fails
      }
    }

    return NextResponse.json(
      {
        message: 'Appointment updated successfully',
        appointment: updatedAppointment,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update appointment.' },
      { status: 500 },
    );
  }
}

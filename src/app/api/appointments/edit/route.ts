/**
 * API Route: /api/appointments/edit
 *
 * Handles appointment modifications with calendar and notification updates.
 * Supports both service-based and category-based appointments.
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateAppointment, findAppointmentById, findUserByEmail } from '../../../../lib/database';
import { updateCalendarEvent } from '../../../../lib/google';
import { sendAppointmentConfirmation } from '../../../../services/messagingService';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      customerName,
      customerEmail,
      date,
      time,
      services,
      stylistId,
      categoryId,
      estimatedDuration,
      totalPrice: providedTotalPrice,
      totalDuration: providedTotalDuration,
    } = body;

    // Validate required fields
    if (!id || !customerName || !customerEmail || !date || !time) {
      return NextResponse.json(
        {
          message:
            'Missing required appointment data: id, customerName, customerEmail, date, and time are required.',
        },
        { status: 400 },
      );
    }

    // Determine booking mode and validate accordingly
    const isCategoryBased = !!categoryId;
    const isServiceBased = Array.isArray(services) && services.length > 0;

    if (!isCategoryBased && !isServiceBased) {
      return NextResponse.json(
        { message: 'Either a service category or at least one service must be selected.' },
        { status: 400 },
      );
    }

    // Get the current appointment to compare changes
    const currentAppointment = await findAppointmentById(id);
    if (!currentAppointment) {
      return NextResponse.json({ message: 'Appointment not found.' }, { status: 404 });
    }

    // Calculate totals based on booking mode
    let totalPrice: number;
    let totalDuration: number;

    if (isCategoryBased) {
      // Category-based: use provided duration or estimated duration
      totalPrice = providedTotalPrice ?? 0; // Price TBD at appointment
      totalDuration = providedTotalDuration ?? estimatedDuration ?? 60;
    } else {
      // Service-based: calculate from services
      // Support both 'price' and 'basePrice' field names for backwards compatibility
      totalPrice =
        providedTotalPrice ??
        services.reduce(
          (sum: number, service: any) => sum + (service.price ?? service.basePrice ?? 0),
          0,
        );
      totalDuration =
        providedTotalDuration ??
        services.reduce((sum: number, service: any) => sum + (service.duration ?? 0), 0);
    }

    const appointmentData = {
      customerName,
      customerEmail,
      date: new Date(date),
      time,
      services: isServiceBased ? services : [],
      totalPrice,
      totalDuration,
      stylistId: stylistId ?? null,
      categoryId: isCategoryBased ? categoryId : null,
      estimatedDuration: isCategoryBased ? (estimatedDuration ?? totalDuration) : null,
    };

    // Update the appointment in the database
    const updatedAppointment = await updateAppointment(id, appointmentData);

    // Detect changes for calendar/notification updates
    const dateChanged =
      new Date(currentAppointment.date).toISOString() !== new Date(date).toISOString() ||
      currentAppointment.time !== time;

    const servicesChanged =
      JSON.stringify(currentAppointment.services) !== JSON.stringify(services);

    const stylistChanged = currentAppointment.stylistId !== stylistId;

    const categoryChanged = currentAppointment.categoryId !== categoryId;

    const significantChange = dateChanged || servicesChanged || stylistChanged || categoryChanged;

    // Update the calendar event if it exists and significant changes were made
    if (updatedAppointment.calendarEventId && significantChange) {
      try {
        await updateCalendarEvent(updatedAppointment.calendarEventId, updatedAppointment);
        console.log(`📅 Calendar event updated for appointment ${id}`);
      } catch (error) {
        console.error('Failed to update calendar event:', error);
        // Don't fail the appointment update if calendar update fails
      }
    }

    // Send notification if significant changes were made
    if (significantChange) {
      try {
        const dbUser = await findUserByEmail(updatedAppointment.customerEmail);
        let user = null;
        if (dbUser) {
          // Convert Prisma types to app types
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

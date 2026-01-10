/**
 * API Route: /api/stylists/me/cancel-appointment
 * Allows stylists to cancel their appointments with multi-channel notifications
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { withAuth } from '@/lib/sessionMiddleware';
import { isStylist } from '@/lib/roleHelpers';
import { deleteCalendarEvent } from '@/lib/google';
import { sendAppointmentCancellation } from '@/services/messagingService';
import { sendCancellationEmail } from '@/services/emailService';
import { getAdminSettings } from '@/lib/database';
import { formatLongDate, formatTime12Hour } from '@/lib/timeUtils';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request: NextRequest, { user }) => {
  // Verify user is a stylist
  if (!isStylist(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = (await request.json()) as {
    appointmentId: string;
    reason?: string;
  };

  const { appointmentId, reason } = body;

  if (!appointmentId) {
    return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
  }

  const db = await getDb();

  try {
    // Get the stylist record
    const stylistResult = await db
      .select({ id: schema.stylists.id })
      .from(schema.stylists)
      .where(eq(schema.stylists.userId, user.id))
      .limit(1);

    const stylist = stylistResult[0];
    if (!stylist) {
      return NextResponse.json({ error: 'Stylist profile not found' }, { status: 404 });
    }

    // Get the appointment and verify it belongs to this stylist
    const appointmentResult = await db
      .select()
      .from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.id, appointmentId),
          eq(schema.appointments.stylistId, stylist.id),
        ),
      )
      .limit(1);

    const appointment = appointmentResult[0];
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found or not assigned to you' },
        { status: 404 },
      );
    }

    if (appointment.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Appointment is already cancelled' }, { status: 400 });
    }

    // Update the appointment status to CANCELLED
    await db
      .update(schema.appointments)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(eq(schema.appointments.id, appointmentId));

    // Delete calendar event if exists
    if (appointment.calendarEventId) {
      try {
        await deleteCalendarEvent(appointment.calendarEventId, stylist.id);
        console.log(`[StylistCancel] Deleted calendar event ${appointment.calendarEventId}`);
      } catch (error) {
        console.error('[StylistCancel] Failed to delete calendar event:', error);
        // Don't fail the cancellation
      }
    }

    // Get service category for the email
    let serviceName = 'Hair Service';
    if (appointment.categoryId) {
      const categoryResult = await db
        .select({ title: schema.serviceCategories.title })
        .from(schema.serviceCategories)
        .where(eq(schema.serviceCategories.id, appointment.categoryId))
        .limit(1);
      if (categoryResult[0]) {
        serviceName = categoryResult[0].title;
      }
    }

    // Get customer user record for notification
    const customerResult = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, appointment.customerEmail))
      .limit(1);

    const customer = customerResult[0];
    const settings = await getAdminSettings();
    const formattedDate = formatLongDate(appointment.date);
    const formattedTime = formatTime12Hour(appointment.time);

    // Send notification based on customer's signup method
    let notificationSent = false;

    if (customer) {
      // Try messaging platforms first (WhatsApp/Telegram)
      if (customer.telegramId || customer.whatsappPhone) {
        const appointmentWithCategory = {
          id: appointment.id,
          date: appointment.date,
          time: appointment.time,
          services: [{ name: serviceName }] as any,
          totalPrice: appointment.totalPrice,
          totalDuration: appointment.totalDuration,
          customerName: appointment.customerName,
          customerEmail: appointment.customerEmail,
          stylist: { name: user.name } as any,
          status: 'CANCELLED' as const,
        } as any;

        const messageSent = await sendAppointmentCancellation(
          {
            ...customer,
            roles: customer.roles as ('CUSTOMER' | 'STYLIST' | 'ADMIN')[],
            authProvider: customer.authProvider as 'email' | 'whatsapp' | 'telegram' | undefined,
            telegramId: customer.telegramId ?? undefined,
            whatsappPhone: customer.whatsappPhone ?? undefined,
            avatar: customer.avatar ?? undefined,
          },
          appointmentWithCategory,
        );

        if (messageSent) {
          notificationSent = true;
          console.log(
            `[StylistCancel] Sent messaging notification to ${appointment.customerEmail}`,
          );
        }
      }

      // Send email notification (for email users or as backup)
      if (!customer.telegramId && !customer.whatsappPhone) {
        const emailResult = await sendCancellationEmail({
          customerEmail: appointment.customerEmail,
          customerName: appointment.customerName,
          serviceName,
          date: formattedDate,
          time: formattedTime,
          stylistName: user.name,
          reason,
          settings: settings ?? undefined,
        });

        if (emailResult.success) {
          notificationSent = true;
          console.log(`[StylistCancel] Sent email notification to ${appointment.customerEmail}`);
        }
      }
    } else {
      // No user record - send email to the provided email address
      const emailResult = await sendCancellationEmail({
        customerEmail: appointment.customerEmail,
        customerName: appointment.customerName,
        serviceName,
        date: formattedDate,
        time: formattedTime,
        stylistName: user.name,
        reason,
        settings: settings ?? undefined,
      });

      if (emailResult.success) {
        notificationSent = true;
        console.log(`[StylistCancel] Sent email notification to ${appointment.customerEmail}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
      notificationSent,
    });
  } catch (error: any) {
    console.error('[StylistCancel] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel appointment' },
      { status: 500 },
    );
  }
});

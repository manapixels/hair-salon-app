/**
 * API Route: /api/payments/webhook
 * Handles Stripe webhook callbacks
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, handlePaymentWebhook } from '@/services/paymentService';
import { sendTelegramMessage } from '@/services/messagingService';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Webhook] Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature);
    if (!event) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log(`[Webhook] Received Stripe event: ${event.type}`);

    // Handle the payment
    const result = await handlePaymentWebhook(event);

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to process webhook' }, { status: 400 });
    }

    // If payment completed, send confirmation to user
    if (
      (event.type === 'payment_intent.succeeded' || event.type === 'checkout.session.completed') &&
      result.depositId
    ) {
      try {
        await sendPaymentConfirmation(result.depositId);
      } catch (e) {
        console.error('[Webhook] Failed to send confirmation:', e);
        // Don't fail the webhook response
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * Send payment confirmation to user via Telegram and/or email
 * Also updates appointment status and syncs to Google Calendar
 */
async function sendPaymentConfirmation(depositId: string) {
  const db = await getDb();

  // Get deposit
  const depositResult = await db
    .select()
    .from(schema.deposits)
    .where(eq(schema.deposits.id, depositId))
    .limit(1);

  const deposit = depositResult[0];
  if (!deposit) return;

  // Get full appointment details for calendar sync
  const apptResult = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.id, deposit.appointmentId))
    .limit(1);

  const appointment = apptResult[0];
  if (!appointment) return;

  // 1. Update appointment status from PENDING_PAYMENT to SCHEDULED
  if (appointment.status === 'PENDING_PAYMENT') {
    await db
      .update(schema.appointments)
      .set({ status: 'SCHEDULED', updatedAt: new Date() })
      .where(eq(schema.appointments.id, appointment.id));
    console.log(`[Webhook] Updated appointment ${appointment.id} status to SCHEDULED`);
  }

  // 2. Sync to Google Calendar if not already done
  if (!appointment.calendarEventId) {
    try {
      const { createCalendarEvent } = await import('@/lib/google');
      const { updateAppointmentCalendarId } = await import('@/lib/database');

      // Get stylist and category for calendar event
      let stylist = null;
      let category = null;

      if (appointment.stylistId) {
        const stylistResult = await db
          .select()
          .from(schema.stylists)
          .where(eq(schema.stylists.id, appointment.stylistId))
          .limit(1);
        stylist = stylistResult[0];
      }

      if (appointment.categoryId) {
        const catResult = await db
          .select()
          .from(schema.serviceCategories)
          .where(eq(schema.serviceCategories.id, appointment.categoryId))
          .limit(1);
        category = catResult[0];
      }

      // Build appointment object for calendar sync
      const appointmentForCalendar = {
        id: appointment.id,
        date: appointment.date,
        time: appointment.time,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        estimatedDuration: appointment.estimatedDuration || 60,
        totalDuration: appointment.totalDuration || appointment.estimatedDuration || 60,
        stylistId: appointment.stylistId,
        stylist: stylist
          ? {
              id: stylist.id,
              name: stylist.name,
              email: stylist.email,
              avatar: stylist.avatar || undefined,
              bio: stylist.bio || undefined,
              specialties: [],
            }
          : undefined,
        category: category
          ? {
              id: category.id,
              title: category.title,
              slug: category.slug,
              description: category.description || undefined,
            }
          : undefined,
      };

      const calendarEventId = await createCalendarEvent(appointmentForCalendar as any);
      if (calendarEventId) {
        await updateAppointmentCalendarId(appointment.id, calendarEventId);
        console.log(
          `[Webhook] ✅ Created calendar event ${calendarEventId} for appointment ${appointment.id}`,
        );
      }
    } catch (calendarError) {
      console.error('[Webhook] Failed to create calendar event:', calendarError);
      // Don't fail the webhook for calendar errors
    }
  }

  const amountFormatted = `$${(deposit.amount / 100).toFixed(2)}`;

  // 3. Send Telegram message if user has telegramId
  if (deposit.userId) {
    const userResult = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, deposit.userId))
      .limit(1);

    const user = userResult[0];
    if (user?.telegramId) {
      const message = `✅ *Deposit Received!*\n\nYour ${amountFormatted} deposit has been confirmed.\n\n📅 Your appointment is booked for:\n${appointment.date.toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'short' })} at ${appointment.time}\n\nSee you then! 💇`;
      await sendTelegramMessage(user.telegramId, message);
      console.log(`✅ Telegram confirmation sent to user ${deposit.userId}`);
    }
  }

  // 4. Send email confirmation for real email addresses
  const isMessagingEmail =
    appointment.customerEmail.endsWith('@whatsapp.local') ||
    appointment.customerEmail.endsWith('@telegram.local');

  if (!isMessagingEmail) {
    try {
      const { sendBookingConfirmationEmail } = await import('@/services/emailService');
      const { format } = await import('date-fns');

      // Get category name
      let serviceName = 'Appointment';
      if (appointment.categoryId) {
        const catResult = await db
          .select({ title: schema.serviceCategories.title })
          .from(schema.serviceCategories)
          .where(eq(schema.serviceCategories.id, appointment.categoryId))
          .limit(1);
        if (catResult[0]) serviceName = catResult[0].title;
      }

      // Get stylist name
      let stylistName: string | null = null;
      if (appointment.stylistId) {
        const stylistResult = await db
          .select({ name: schema.stylists.name })
          .from(schema.stylists)
          .where(eq(schema.stylists.id, appointment.stylistId))
          .limit(1);
        if (stylistResult[0]) stylistName = stylistResult[0].name;
      }

      await sendBookingConfirmationEmail({
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        appointmentId: appointment.id,
        serviceName,
        stylistName,
        date: format(appointment.date, 'EEEE, MMMM d, yyyy'),
        time: appointment.time,
        duration: appointment.estimatedDuration || 60,
      });
      console.log(`✉️ Confirmation email sent to ${appointment.customerEmail}`);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }
  }
}

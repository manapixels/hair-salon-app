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

  // Get appointment details
  const apptResult = await db
    .select({
      id: schema.appointments.id,
      date: schema.appointments.date,
      time: schema.appointments.time,
      customerName: schema.appointments.customerName,
      customerEmail: schema.appointments.customerEmail,
      estimatedDuration: schema.appointments.estimatedDuration,
      categoryId: schema.appointments.categoryId,
      stylistId: schema.appointments.stylistId,
    })
    .from(schema.appointments)
    .where(eq(schema.appointments.id, deposit.appointmentId))
    .limit(1);

  const appointment = apptResult[0];
  if (!appointment) return;

  const amountFormatted = `$${(deposit.amount / 100).toFixed(2)}`;

  // Send Telegram message if user has telegramId
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

  // Send email confirmation for real email addresses
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

/**
 * API Route: /api/payments/webhook
 * Handles HitPay webhook callbacks
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookSignature,
  handlePaymentWebhook,
  getDepositByAppointmentId,
} from '@/services/paymentService';
import { sendTelegramMessage } from '@/services/messagingService';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // HitPay sends form data or JSON
    const contentType = request.headers.get('content-type') || '';
    let payload: Record<string, any>;

    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      // Form data
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    }

    console.log('[Webhook] Received HitPay webhook:', JSON.stringify(payload));

    // Verify signature if HMAC is present
    if (payload.hmac) {
      const isValid = verifyWebhookSignature(payload, payload.hmac);
      if (!isValid) {
        console.error('[Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Handle the payment
    const result = await handlePaymentWebhook({
      payment_id: payload.payment_id,
      payment_request_id: payload.payment_request_id,
      reference_number: payload.reference_number,
      status: payload.status,
      amount: payload.amount,
      currency: payload.currency,
      hmac: payload.hmac,
    });

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to process webhook' }, { status: 400 });
    }

    // If payment completed, send confirmation to user
    if (payload.status === 'completed' && result.depositId) {
      try {
        await sendPaymentConfirmation(result.depositId);
      } catch (e) {
        console.error('[Webhook] Failed to send confirmation:', e);
        // Don't fail the webhook response
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * Send payment confirmation to user via Telegram if they have an account
 */
async function sendPaymentConfirmation(depositId: string) {
  const db = await getDb();

  // Get deposit with user
  const depositResult = await db
    .select()
    .from(schema.deposits)
    .where(eq(schema.deposits.id, depositId))
    .limit(1);

  const deposit = depositResult[0];
  if (!deposit?.userId) return;

  // Get user
  const userResult = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, deposit.userId))
    .limit(1);

  const user = userResult[0];
  if (!user?.telegramId) return;

  // Get appointment details
  const apptResult = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.id, deposit.appointmentId))
    .limit(1);

  const appointment = apptResult[0];
  if (!appointment) return;

  const amountFormatted = `$${(deposit.amount / 100).toFixed(2)}`;
  const message = `✅ *Deposit Received!*\n\nYour ${amountFormatted} deposit has been confirmed.\n\n📅 Your appointment is booked for:\n${appointment.date.toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'short' })} at ${appointment.time}\n\nSee you then! 💇`;

  await sendTelegramMessage(user.telegramId, message);
}

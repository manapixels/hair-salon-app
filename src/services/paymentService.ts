/**
 * Payment Service for HitPay integration
 * Handles deposit payments for no-show protection
 */
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import type { Deposit, DepositStatus } from '@/types';
import crypto from 'crypto';

// HitPay API configuration
const HITPAY_API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api.hit-pay.com/v1'
    : 'https://api.sandbox.hit-pay.com/v1';

/**
 * Check if a user requires a deposit based on their visit history
 */
export async function requiresDeposit(customerEmail: string): Promise<{
  required: boolean;
  totalVisits: number;
  trustThreshold: number;
}> {
  const db = await getDb();

  // Get deposit settings
  const settingsResult = await db.select().from(schema.adminSettings).limit(1);
  const settings = settingsResult[0];

  if (!settings?.depositEnabled) {
    return { required: false, totalVisits: 0, trustThreshold: 0 };
  }

  // Check user's visit history
  const userResult = await db
    .select({ totalVisits: schema.users.totalVisits })
    .from(schema.users)
    .where(eq(schema.users.email, customerEmail))
    .limit(1);

  const totalVisits = userResult[0]?.totalVisits ?? 0;
  const trustThreshold = settings.depositTrustThreshold ?? 1;

  return {
    required: totalVisits < trustThreshold,
    totalVisits,
    trustThreshold,
  };
}

/**
 * Get deposit settings from admin settings
 */
export async function getDepositSettings(): Promise<{
  enabled: boolean;
  percentage: number;
  trustThreshold: number;
  refundWindowHours: number;
}> {
  const db = await getDb();
  const result = await db.select().from(schema.adminSettings).limit(1);
  const settings = result[0];

  return {
    enabled: settings?.depositEnabled ?? true,
    percentage: settings?.depositPercentage ?? 15,
    trustThreshold: settings?.depositTrustThreshold ?? 1,
    refundWindowHours: settings?.depositRefundWindowHours ?? 24,
  };
}

/**
 * Calculate deposit amount based on total price and percentage
 */
export function calculateDepositAmount(totalPrice: number, percentage: number): number {
  // totalPrice is in cents, return deposit in cents
  return Math.ceil(totalPrice * (percentage / 100));
}

/**
 * Create a HitPay payment request and store pending deposit
 */
export async function createDepositPayment(params: {
  appointmentId: string;
  amount: number; // in cents
  customerEmail: string;
  customerName: string;
  userId?: string;
  redirectUrl: string;
  webhookUrl: string;
}): Promise<{ depositId: string; paymentUrl: string } | null> {
  const db = await getDb();

  // Amount in dollars for HitPay API
  const amountInDollars = (params.amount / 100).toFixed(2);

  // Calculate expiry (30 minutes from now)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  // Create deposit record first
  const depositResult = await db
    .insert(schema.deposits)
    .values({
      appointmentId: params.appointmentId,
      userId: params.userId,
      customerEmail: params.customerEmail,
      amount: params.amount,
      currency: 'SGD',
      status: 'PENDING',
      expiresAt,
      createdAt: new Date(),
    })
    .returning();

  const deposit = depositResult[0];
  if (!deposit) {
    console.error('[Payment] Failed to create deposit record');
    return null;
  }

  // Create HitPay payment request
  try {
    const response = await fetch(`${HITPAY_API_URL}/payment-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BUSINESS-API-KEY': process.env.HITPAY_API_KEY || '',
      },
      body: JSON.stringify({
        amount: amountInDollars,
        currency: 'SGD',
        email: params.customerEmail,
        name: params.customerName,
        purpose: `Booking Deposit - ${params.appointmentId.slice(0, 8)}`,
        reference_number: deposit.id,
        redirect_url: params.redirectUrl,
        webhook: params.webhookUrl,
        allow_repeated_payments: false,
        expiry_date: expiresAt.toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Payment] HitPay API error:', error);
      // Clean up the deposit record
      await db.delete(schema.deposits).where(eq(schema.deposits.id, deposit.id));
      return null;
    }

    const data = (await response.json()) as { id: string; url: string };

    // Update deposit with HitPay payment details
    await db
      .update(schema.deposits)
      .set({
        hitpayPaymentId: data.id,
        hitpayPaymentUrl: data.url,
      })
      .where(eq(schema.deposits.id, deposit.id));

    console.log(`[Payment] Created deposit ${deposit.id} for appointment ${params.appointmentId}`);

    return {
      depositId: deposit.id,
      paymentUrl: data.url,
    };
  } catch (error) {
    console.error('[Payment] Error creating HitPay payment:', error);
    // Clean up the deposit record
    await db.delete(schema.deposits).where(eq(schema.deposits.id, deposit.id));
    return null;
  }
}

/**
 * Verify HitPay webhook signature
 */
export function verifyWebhookSignature(payload: Record<string, any>, signature: string): boolean {
  const salt = process.env.HITPAY_SALT || '';
  if (!salt) {
    console.warn('[Payment] HITPAY_SALT not configured, skipping signature verification');
    return true;
  }

  // HitPay HMAC signature verification
  // Build the string to sign (sorted keys, exclude hmac)
  const sortedKeys = Object.keys(payload)
    .filter(k => k !== 'hmac')
    .sort();
  const stringToSign = sortedKeys.map(k => `${k}${payload[k]}`).join('');

  const expectedSignature = crypto.createHmac('sha256', salt).update(stringToSign).digest('hex');

  return signature === expectedSignature;
}

/**
 * Handle HitPay webhook for payment completion
 */
export async function handlePaymentWebhook(payload: {
  payment_id: string;
  payment_request_id: string;
  reference_number: string; // This is our deposit ID
  status: string;
  amount: string;
  currency: string;
  hmac?: string;
}): Promise<{ success: boolean; depositId?: string }> {
  const db = await getDb();

  // Find the deposit by reference number (which is our deposit ID)
  const depositResult = await db
    .select()
    .from(schema.deposits)
    .where(eq(schema.deposits.id, payload.reference_number))
    .limit(1);

  const deposit = depositResult[0];
  if (!deposit) {
    console.error(`[Payment] Deposit not found: ${payload.reference_number}`);
    return { success: false };
  }

  // Update deposit status based on payment status
  if (payload.status === 'completed') {
    await db
      .update(schema.deposits)
      .set({
        status: 'PAID',
        hitpayPaymentId: payload.payment_id,
        paidAt: new Date(),
      })
      .where(eq(schema.deposits.id, deposit.id));

    console.log(`[Payment] Deposit ${deposit.id} marked as PAID`);
    return { success: true, depositId: deposit.id };
  } else if (payload.status === 'failed' || payload.status === 'expired') {
    console.log(`[Payment] Payment ${payload.status} for deposit ${deposit.id}`);
    // Keep as PENDING, user can retry
    return { success: true, depositId: deposit.id };
  }

  return { success: true, depositId: deposit.id };
}

/**
 * Get deposit by appointment ID
 */
export async function getDepositByAppointmentId(appointmentId: string): Promise<Deposit | null> {
  const db = await getDb();

  const result = await db
    .select()
    .from(schema.deposits)
    .where(eq(schema.deposits.appointmentId, appointmentId))
    .limit(1);

  if (!result[0]) return null;

  const dep = result[0];
  return {
    id: dep.id,
    appointmentId: dep.appointmentId,
    userId: dep.userId,
    customerEmail: dep.customerEmail,
    amount: dep.amount,
    currency: dep.currency,
    hitpayPaymentId: dep.hitpayPaymentId,
    hitpayPaymentUrl: dep.hitpayPaymentUrl,
    status: dep.status as DepositStatus,
    expiresAt: dep.expiresAt,
    createdAt: dep.createdAt,
    paidAt: dep.paidAt,
    refundedAt: dep.refundedAt,
  };
}

/**
 * Get pending deposits by email (for guest recovery)
 */
export async function getPendingDepositsByEmail(email: string): Promise<Deposit[]> {
  const db = await getDb();

  const results = await db
    .select()
    .from(schema.deposits)
    .where(and(eq(schema.deposits.customerEmail, email), eq(schema.deposits.status, 'PENDING')));

  return results.map(dep => ({
    id: dep.id,
    appointmentId: dep.appointmentId,
    userId: dep.userId,
    customerEmail: dep.customerEmail,
    amount: dep.amount,
    currency: dep.currency,
    hitpayPaymentId: dep.hitpayPaymentId,
    hitpayPaymentUrl: dep.hitpayPaymentUrl,
    status: dep.status as DepositStatus,
    expiresAt: dep.expiresAt,
    createdAt: dep.createdAt,
    paidAt: dep.paidAt,
    refundedAt: dep.refundedAt,
  }));
}

/**
 * Refund a deposit (for early cancellations)
 */
export async function refundDeposit(depositId: string): Promise<boolean> {
  const db = await getDb();

  const depositResult = await db
    .select()
    .from(schema.deposits)
    .where(eq(schema.deposits.id, depositId))
    .limit(1);

  const deposit = depositResult[0];
  if (!deposit || deposit.status !== 'PAID' || !deposit.hitpayPaymentId) {
    console.error(`[Payment] Cannot refund deposit ${depositId}: invalid state`);
    return false;
  }

  try {
    // Call HitPay refund API
    const response = await fetch(`${HITPAY_API_URL}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BUSINESS-API-KEY': process.env.HITPAY_API_KEY || '',
      },
      body: JSON.stringify({
        payment_id: deposit.hitpayPaymentId,
        amount: (deposit.amount / 100).toFixed(2),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Payment] HitPay refund error:', error);
      return false;
    }

    // Update deposit status
    await db
      .update(schema.deposits)
      .set({
        status: 'REFUNDED',
        refundedAt: new Date(),
      })
      .where(eq(schema.deposits.id, depositId));

    console.log(`[Payment] Deposit ${depositId} refunded`);
    return true;
  } catch (error) {
    console.error('[Payment] Error refunding deposit:', error);
    return false;
  }
}

/**
 * Forfeit a deposit (for no-shows or late cancellations)
 */
export async function forfeitDeposit(depositId: string): Promise<boolean> {
  const db = await getDb();

  await db
    .update(schema.deposits)
    .set({ status: 'FORFEITED' })
    .where(eq(schema.deposits.id, depositId));

  console.log(`[Payment] Deposit ${depositId} forfeited`);
  return true;
}

/**
 * Cleanup expired pending deposits
 */
export async function cleanupExpiredDeposits(): Promise<number> {
  const db = await getDb();

  const result = await db
    .delete(schema.deposits)
    .where(and(eq(schema.deposits.status, 'PENDING'), lt(schema.deposits.expiresAt, new Date())))
    .returning();

  if (result.length > 0) {
    console.log(`[Payment] Cleaned up ${result.length} expired deposits`);
  }

  return result.length;
}

/**
 * Payment Service for Stripe integration
 * Handles deposit payments for no-show protection
 */
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import type { Deposit, DepositStatus } from '@/types';
import Stripe from 'stripe';

// Lazy Stripe initialization to avoid build-time errors
// Configured for Cloudflare Workers compatibility (uses fetch instead of http)
let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeInstance = new Stripe(key, {
      // Use fetch-based HTTP client for Cloudflare Workers compatibility
      httpClient: Stripe.createFetchHttpClient(),
      // Disable telemetry to reduce request overhead
      telemetry: false,
    });
  }
  return stripeInstance;
}

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
 * Create a Stripe PaymentIntent and store pending deposit
 * Returns clientSecret for use with Stripe Elements on frontend
 */
export async function createDepositPayment(params: {
  appointmentId: string;
  amount: number; // in cents
  customerEmail: string;
  customerName: string;
  userId?: string;
}): Promise<{ depositId: string; clientSecret: string } | null> {
  const db = await getDb();

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

  // Create Stripe PaymentIntent
  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: params.amount, // Stripe uses cents
      currency: 'sgd',
      receipt_email: params.customerEmail,
      metadata: {
        depositId: deposit.id,
        appointmentId: params.appointmentId,
        customerName: params.customerName,
      },
      description: `Booking Deposit - ${params.appointmentId.slice(0, 8)}`,
      // Enable automatic payment methods (cards, Apple Pay, Google Pay)
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update deposit with Stripe PaymentIntent ID
    await db
      .update(schema.deposits)
      .set({
        stripePaymentIntentId: paymentIntent.id,
      })
      .where(eq(schema.deposits.id, deposit.id));

    console.log(`[Payment] Created deposit ${deposit.id} for appointment ${params.appointmentId}`);

    return {
      depositId: deposit.id,
      clientSecret: paymentIntent.client_secret!,
    };
  } catch (error) {
    console.error('[Payment] Error creating Stripe PaymentIntent:', error);
    // Clean up the deposit record
    await db.delete(schema.deposits).where(eq(schema.deposits.id, deposit.id));
    return null;
  }
}

/**
 * Create a Stripe Checkout Session for Telegram (external redirect)
 * Used when embedded Elements aren't available (e.g., Telegram bot)
 */
export async function createCheckoutSession(params: {
  appointmentId: string;
  amount: number; // in cents
  customerEmail: string;
  customerName: string;
  userId?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ depositId: string; checkoutUrl: string } | null> {
  const db = await getDb();

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

  // Create Stripe Checkout Session
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: params.customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'sgd',
            product_data: {
              name: 'Booking Deposit',
              description: `Deposit for appointment ${params.appointmentId.slice(0, 8)}`,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        depositId: deposit.id,
        appointmentId: params.appointmentId,
        customerName: params.customerName,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    });

    // Update deposit with Stripe Session ID (we'll use this to track)
    await db
      .update(schema.deposits)
      .set({
        stripePaymentIntentId: (session.payment_intent as string) || session.id,
      })
      .where(eq(schema.deposits.id, deposit.id));

    console.log(`[Payment] Created Checkout Session for deposit ${deposit.id}`);

    return {
      depositId: deposit.id,
      checkoutUrl: session.url!,
    };
  } catch (error) {
    console.error('[Payment] Error creating Stripe Checkout Session:', error);
    // Clean up the deposit record
    await db.delete(schema.deposits).where(eq(schema.deposits.id, deposit.id));
    return null;
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
): Stripe.Event | null {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('[Payment] STRIPE_WEBHOOK_SECRET not configured');
    return null;
  }

  try {
    return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error('[Payment] Webhook signature verification failed:', err.message);
    return null;
  }
}

/**
 * Handle Stripe webhook for payment completion
 */
export async function handlePaymentWebhook(event: Stripe.Event): Promise<{
  success: boolean;
  depositId?: string;
}> {
  const db = await getDb();

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const depositId = paymentIntent.metadata?.depositId;

    if (!depositId) {
      console.error('[Payment] No depositId in PaymentIntent metadata');
      return { success: false };
    }

    // Update deposit status
    await db
      .update(schema.deposits)
      .set({
        status: 'PAID',
        stripePaymentIntentId: paymentIntent.id,
        paidAt: new Date(),
      })
      .where(eq(schema.deposits.id, depositId));

    console.log(`[Payment] Deposit ${depositId} marked as PAID`);
    return { success: true, depositId };
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const depositId = session.metadata?.depositId;

    if (!depositId) {
      console.error('[Payment] No depositId in Checkout Session metadata');
      return { success: false };
    }

    // Update deposit status
    await db
      .update(schema.deposits)
      .set({
        status: 'PAID',
        stripePaymentIntentId: (session.payment_intent as string) || session.id,
        paidAt: new Date(),
      })
      .where(eq(schema.deposits.id, depositId));

    console.log(`[Payment] Deposit ${depositId} marked as PAID (via Checkout)`);
    return { success: true, depositId };
  }

  // Handle failed payments (optional logging)
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(`[Payment] Payment failed for intent ${paymentIntent.id}`);
    return { success: true };
  }

  return { success: true };
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
    stripePaymentIntentId: dep.stripePaymentIntentId,
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
    stripePaymentIntentId: dep.stripePaymentIntentId,
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
  if (!deposit || deposit.status !== 'PAID' || !deposit.stripePaymentIntentId) {
    console.error(`[Payment] Cannot refund deposit ${depositId}: invalid state`);
    return false;
  }

  try {
    // Create Stripe refund
    await getStripe().refunds.create({
      payment_intent: deposit.stripePaymentIntentId,
      amount: deposit.amount,
    });

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

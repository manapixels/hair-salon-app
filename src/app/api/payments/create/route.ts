/**
 * API Route: /api/payments/create
 * Creates a Stripe PaymentIntent for deposit (Web) or Checkout Session (Telegram)
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  requiresDeposit,
  getDepositSettings,
  calculateDepositAmount,
  createDepositPayment,
  createCheckoutSession,
} from '@/services/paymentService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      appointmentId: string;
      totalPrice: number;
      customerEmail: string;
      customerName: string;
      userId?: string;
      source?: 'web' | 'telegram'; // Determines which flow to use
    };
    const {
      appointmentId,
      totalPrice, // in cents
      customerEmail,
      customerName,
      userId,
      source = 'web', // Default to web (embedded Elements)
    } = body;

    if (!appointmentId || !totalPrice || !customerEmail || !customerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if deposit is required
    const { required } = await requiresDeposit(customerEmail);
    if (!required) {
      return NextResponse.json({ required: false });
    }

    // Get deposit settings
    const settings = await getDepositSettings();
    if (!settings.enabled) {
      return NextResponse.json({ required: false });
    }

    // Calculate deposit amount
    const depositAmount = calculateDepositAmount(totalPrice, settings.percentage);

    // Build URLs for Telegram flow
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    if (source === 'telegram') {
      // Use Checkout Session for Telegram (external redirect)
      const result = await createCheckoutSession({
        appointmentId,
        amount: depositAmount,
        customerEmail,
        customerName,
        userId,
        successUrl: `${baseUrl}/booking/payment-success?appointmentId=${appointmentId}`,
        cancelUrl: `${baseUrl}/booking/payment-cancelled?appointmentId=${appointmentId}`,
      });

      if (!result) {
        return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 });
      }

      return NextResponse.json({
        required: true,
        depositId: result.depositId,
        paymentUrl: result.checkoutUrl, // For Telegram - external link
        amount: depositAmount,
        percentage: settings.percentage,
      });
    }

    // Use PaymentIntent for Web (embedded Elements)
    const result = await createDepositPayment({
      appointmentId,
      amount: depositAmount,
      customerEmail,
      customerName,
      userId,
    });

    if (!result) {
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }

    return NextResponse.json({
      required: true,
      depositId: result.depositId,
      clientSecret: result.clientSecret, // For web - use with Stripe Elements
      amount: depositAmount,
      percentage: settings.percentage,
    });
  } catch (error: any) {
    console.error('[API] Payment create error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

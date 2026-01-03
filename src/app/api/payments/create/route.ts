/**
 * API Route: /api/payments/create
 * Creates a HitPay payment request for deposit
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  requiresDeposit,
  getDepositSettings,
  calculateDepositAmount,
  createDepositPayment,
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
    };
    const {
      appointmentId,
      totalPrice, // in cents
      customerEmail,
      customerName,
      userId,
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

    // Build URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUrl = `${baseUrl}/booking/payment-success?appointmentId=${appointmentId}`;
    const webhookUrl = `${baseUrl}/api/payments/webhook`;

    // Create payment
    const result = await createDepositPayment({
      appointmentId,
      amount: depositAmount,
      customerEmail,
      customerName,
      userId,
      redirectUrl,
      webhookUrl,
    });

    if (!result) {
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }

    return NextResponse.json({
      required: true,
      depositId: result.depositId,
      paymentUrl: result.paymentUrl,
      amount: depositAmount,
      percentage: settings.percentage,
    });
  } catch (error: any) {
    console.error('[API] Payment create error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

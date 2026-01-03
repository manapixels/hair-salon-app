/**
 * API Route: /api/bookings/pending
 * Get pending bookings by email for guest recovery
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPendingBookingsByEmail } from '@/services/bookingRecoveryService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const pendingBookings = await getPendingBookingsByEmail(email);

    return NextResponse.json({ pendingBookings });
  } catch (error: any) {
    console.error('[API] Pending bookings error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

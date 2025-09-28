/**
 * API Route: /api/availability
 *
 * Handles availability checking for general salon or specific stylists
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAvailability, getStylistAvailability } from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const stylistId = searchParams.get('stylistId');

    if (!date) {
      return NextResponse.json({ message: 'Date query parameter is required.' }, { status: 400 });
    }

    const targetDate = new Date(date);

    // Check if we need stylist-specific availability
    if (stylistId) {
      const slots = await getStylistAvailability(targetDate, stylistId);
      return NextResponse.json(slots, { status: 200 });
    } else {
      // Return general salon availability
      const slots = await getAvailability(targetDate);
      return NextResponse.json(slots, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { message: 'Failed to get availability.', error: error.message },
      { status: 500 },
    );
  }
}

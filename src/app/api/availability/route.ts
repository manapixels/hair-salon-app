/**
 * API Route: /api/availability
 *
 * Handles availability checking for general salon or specific stylists
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAvailability, getStylistAvailability } from '../../../lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const stylistId = searchParams.get('stylistId');
    const duration = searchParams.get('duration');

    if (!date) {
      return NextResponse.json({ message: 'Date query parameter is required.' }, { status: 400 });
    }

    const targetDate = new Date(date);

    // Validate date
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ message: 'Invalid date format.' }, { status: 400 });
    }

    // Check if we need stylist-specific availability
    let slots: string[];
    if (stylistId) {
      slots = await getStylistAvailability(targetDate, stylistId);
    } else {
      // Return general salon availability
      slots = await getAvailability(targetDate);
    }

    // Filter slots based on duration if provided
    // Only return slots that have enough consecutive time for the service
    if (duration) {
      const durationMinutes = parseInt(duration, 10);
      console.log(
        `[Availability] Duration filter: ${durationMinutes}min, slots before filter:`,
        slots.length,
      );
      if (!isNaN(durationMinutes) && durationMinutes > 30) {
        const numSlotsRequired = Math.ceil(durationMinutes / 30);
        const slotsSet = new Set(slots);
        console.log(`[Availability] Need ${numSlotsRequired} consecutive slots`);

        slots = slots.filter(startSlot => {
          // Check if all consecutive slots are available
          const startTime = new Date(`1970-01-01T${startSlot}:00`);
          for (let i = 1; i < numSlotsRequired; i++) {
            const nextTime = new Date(startTime);
            nextTime.setMinutes(startTime.getMinutes() + i * 30);
            const nextSlot = nextTime.toTimeString().substring(0, 5);
            if (!slotsSet.has(nextSlot)) {
              return false;
            }
          }
          return true;
        });
        console.log(`[Availability] Slots after filter:`, slots);
      }
    } else {
      console.log(`[Availability] No duration passed, returning all ${slots.length} slots`);
    }

    return NextResponse.json(slots, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching availability:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { message: 'Failed to get availability.', error: error.message, stack: error.stack },
      { status: 500 },
    );
  }
}

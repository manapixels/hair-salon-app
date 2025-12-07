/**
 * API Route: /api/admin/blocked-slots
 * Handles blocking and unblocking time slots.
 */
import { NextRequest, NextResponse } from 'next/server';
import { blockSlot, unblockSlot } from '../../../../lib/database';

// POST /api/admin/blocked-slots
export async function POST(request: NextRequest) {
  try {
    const requestBody = (await request.json()) as { date: string; time: string };
    const { date, time } = requestBody;

    if (!date || !time) {
      return NextResponse.json({ message: 'Date and time are required.' }, { status: 400 });
    }

    const newBlockedSlots = blockSlot(new Date(date), time);
    return NextResponse.json(newBlockedSlots, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/blocked-slots
export async function DELETE(request: NextRequest) {
  try {
    const requestBody = (await request.json()) as { date: string; time: string };
    const { date, time } = requestBody;

    if (!date || !time) {
      return NextResponse.json({ message: 'Date and time are required.' }, { status: 400 });
    }

    const newBlockedSlots = unblockSlot(new Date(date), time);
    return NextResponse.json(newBlockedSlots, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

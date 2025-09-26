/**
 * API Route: /api/admin/blocked-slots
 * Handles blocking and unblocking time slots.
 */
import { blockSlot, unblockSlot } from '../../../lib/database';

// POST /api/admin/blocked-slots
export async function handlePost(requestBody: { date: string, time: string }) {
    const { date, time } = requestBody;
    if (!date || !time) {
        return { status: 400, body: { message: 'Date and time are required.' } };
    }
    try {
        const newBlockedSlots = blockSlot(new Date(date), time);
        return { status: 200, body: newBlockedSlots };
    } catch (error: any) {
        return { status: 500, body: { message: error.message } };
    }
}

// DELETE /api/admin/blocked-slots
export async function handleDelete(requestBody: { date: string, time: string }) {
    const { date, time } = requestBody;
     if (!date || !time) {
        return { status: 400, body: { message: 'Date and time are required.' } };
    }
    try {
        const newBlockedSlots = unblockSlot(new Date(date), time);
        return { status: 200, body: newBlockedSlots };
    } catch (error: any) {
        return { status: 500, body: { message: error.message } };
    }
}
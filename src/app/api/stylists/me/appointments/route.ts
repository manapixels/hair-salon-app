import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/secureSession';
import { getStylistByUserId, getAppointments } from '@/lib/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stylists/me/appointments
 * Returns appointments for the logged-in stylist
 */
export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stylist = await getStylistByUserId(user.id);
    if (!stylist) {
      return NextResponse.json({ error: 'Stylist profile not found' }, { status: 404 });
    }

    // Get all appointments and filter by stylistId
    const allAppointments = await getAppointments();
    const stylistAppointments = allAppointments
      .filter(apt => apt.stylistId === stylist.id)
      .filter(apt => {
        // Only show upcoming and today's appointments
        const appointmentDate = new Date(apt.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return appointmentDate >= today;
      })
      .sort((a, b) => {
        // Sort by date ascending, then by time
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });

    return NextResponse.json(stylistAppointments);
  } catch (error) {
    console.error('Error fetching stylist appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

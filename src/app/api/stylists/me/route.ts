import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/secureSession';
import { getStylistByUserId } from '@/lib/database';

/**
 * GET /api/stylists/me
 * Returns the current logged-in user's stylist profile
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

    // Return only the fields needed by the dashboard
    return NextResponse.json({
      id: stylist.id,
      name: stylist.name,
      email: stylist.email,
      bio: stylist.bio,
      avatar: stylist.avatar,
      googleEmail: stylist.googleEmail,
      googleCalendarId: stylist.googleCalendarId,
    });
  } catch (error) {
    console.error('Error fetching stylist profile:', error);
    return NextResponse.json({ error: 'Failed to fetch stylist profile' }, { status: 500 });
  }
}

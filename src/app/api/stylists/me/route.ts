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

    // Calculate Google token status
    let googleTokenStatus: 'valid' | 'expiring_soon' | 'expired' | 'not_connected' =
      'not_connected';

    if (stylist.googleRefreshToken) {
      const now = Date.now();
      const tokenExpiry = stylist.googleTokenExpiry?.getTime() || 0;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      if (tokenExpiry === 0) {
        // Has refresh token but no expiry - assume valid
        googleTokenStatus = 'valid';
      } else if (now > tokenExpiry) {
        // Token is expired - but refresh might still work
        googleTokenStatus = 'expired';
      } else if (now > tokenExpiry - sevenDaysMs) {
        // Token expires within 7 days
        googleTokenStatus = 'expiring_soon';
      } else {
        googleTokenStatus = 'valid';
      }
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
      googleTokenStatus,
      googleTokenExpiry: stylist.googleTokenExpiry?.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stylist profile:', error);
    return NextResponse.json({ error: 'Failed to fetch stylist profile' }, { status: 500 });
  }
}

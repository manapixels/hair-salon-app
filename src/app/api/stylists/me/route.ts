import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/secureSession';
import { getStylistByUserId } from '@/lib/database';

export const dynamic = 'force-dynamic';

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
    // The refresh token is what matters - access tokens expire hourly but are auto-refreshed
    // We only show warnings if:
    // - No refresh token (not connected)
    // - googleTokenInvalid flag is set (token was revoked or refresh failed)
    let googleTokenStatus: 'valid' | 'expiring_soon' | 'expired' | 'not_connected' =
      'not_connected';

    if (stylist.googleRefreshToken) {
      // Check if the token was marked as invalid (refresh failed)
      if ((stylist as any).googleTokenInvalid) {
        googleTokenStatus = 'expired';
      } else {
        // Has valid refresh token - we can always get new access tokens
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

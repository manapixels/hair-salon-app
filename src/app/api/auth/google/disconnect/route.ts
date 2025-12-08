import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSessionFromCookie } from '@/lib/secureSession';
import { getStylistByUserId, clearStylistGoogleTokens } from '@/lib/database';

/**
 * POST /api/auth/google/disconnect
 * Disconnects Google Calendar by revoking tokens and clearing from database
 */
export async function POST() {
  try {
    // 1. Verify user is logged in
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get stylist profile
    const stylist = await getStylistByUserId(user.id);
    if (!stylist) {
      return NextResponse.json({ error: 'Stylist profile not found' }, { status: 404 });
    }

    // 3. Revoke token with Google if we have one
    if (stylist.googleAccessToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_OAUTH_CLIENT_ID,
          process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        );
        await oauth2Client.revokeToken(stylist.googleAccessToken);
        console.log(`Revoked Google token for stylist ${stylist.id}`);
      } catch (revokeError) {
        // Log but don't fail - token might already be invalid
        console.warn('Failed to revoke Google token:', revokeError);
      }
    }

    // 4. Clear tokens from database
    await clearStylistGoogleTokens(stylist.id);

    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected',
    });
  } catch (error) {
    console.error('Google OAuth disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect Google Calendar' }, { status: 500 });
  }
}

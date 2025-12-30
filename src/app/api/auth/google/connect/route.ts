import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSessionFromCookie } from '@/lib/secureSession';
import { getStylistByUserId } from '@/lib/database';
import { hasStylistAccess } from '@/lib/roleHelpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google/connect
 * Initiates the Google OAuth2 flow for stylists to connect their calendar
 */
export async function GET(request: Request) {
  try {
    // 1. Verify user is logged in
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify user has stylist-level access (STYLIST or ADMIN)
    if (!hasStylistAccess(user)) {
      return NextResponse.json(
        { error: 'Only stylists can connect Google Calendar' },
        { status: 403 },
      );
    }

    // 3. Verify stylist record exists
    const stylist = await getStylistByUserId(user.id);
    if (!stylist) {
      return NextResponse.json({ error: 'Stylist profile not found' }, { status: 404 });
    }

    // 4. Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI,
    );

    // 5. Generate authorization URL
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    // Use stylist ID as state for CSRF protection
    const state = Buffer.from(JSON.stringify({ stylistId: stylist.id, userId: user.id })).toString(
      'base64',
    );

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: scopes,
      state,
      prompt: 'consent', // Force consent to ensure refresh token is returned
    });

    // 6. Redirect to Google consent screen
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error('Google OAuth connect error:', error);
    return NextResponse.json({ error: 'Failed to initiate Google OAuth' }, { status: 500 });
  }
}

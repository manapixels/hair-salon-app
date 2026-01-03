import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/secureSession';
import { getStylistByUserId } from '@/lib/database';
import { hasStylistAccess } from '@/lib/roleHelpers';

export const dynamic = 'force-dynamic';

/**
 * Build Google OAuth authorization URL manually
 * (Cloudflare Workers compatible - no googleapis library needed)
 */
function buildAuthorizationUrl(state: string): string {
  const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI || '',
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline', // Get refresh token
    prompt: 'consent', // Force consent to ensure refresh token is returned
    state,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * GET /api/auth/google/connect
 * Initiates the Google OAuth2 flow for stylists to connect their calendar
 * Uses manual URL construction for Cloudflare Workers compatibility
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

    // 4. Use stylist ID as state for CSRF protection
    const state = Buffer.from(JSON.stringify({ stylistId: stylist.id, userId: user.id })).toString(
      'base64',
    );

    // 5. Generate authorization URL manually (Workers compatible)
    const authorizationUrl = buildAuthorizationUrl(state);

    // 6. Redirect to Google consent screen
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error('Google OAuth connect error:', error);
    return NextResponse.json({ error: 'Failed to initiate Google OAuth' }, { status: 500 });
  }
}

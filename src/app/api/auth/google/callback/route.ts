import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import {
  updateStylistGoogleTokens,
  markStylistTokenInvalid,
  getStylistWithUser,
} from '@/lib/database';
import { sendCalendarReconnectSuccess } from '@/services/calendarReminderService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google/callback
 * Handles the OAuth2 callback from Google, exchanges code for tokens
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle user denying consent
    if (error) {
      console.log('Google OAuth denied:', error);
      return NextResponse.redirect(new URL('/dashboard?google_error=consent_denied', request.url));
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard?google_error=missing_params', request.url));
    }

    // Decode state to get stylist info
    let stateData: { stylistId: string; userId: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(new URL('/dashboard?google_error=invalid_state', request.url));
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI,
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Missing tokens from Google OAuth response');
      return NextResponse.redirect(new URL('/dashboard?google_error=missing_tokens', request.url));
    }

    // Get user's email from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const googleEmail = userInfo.data.email || 'Unknown';

    // Calculate token expiry
    const tokenExpiry = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    // Save tokens to database
    await updateStylistGoogleTokens(stateData.stylistId, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiry: tokenExpiry,
      googleCalendarId: 'primary', // Use primary calendar
      googleEmail: googleEmail,
    });

    // Clear invalid token flag (reconnection successful)
    await markStylistTokenInvalid(stateData.stylistId, false);

    // Send success notification to stylist via their preferred channel
    try {
      const stylistWithUser = await getStylistWithUser(stateData.stylistId);
      if (stylistWithUser) {
        await sendCalendarReconnectSuccess(stylistWithUser.stylist, stylistWithUser.user);
        console.log(`Sent calendar reconnection success message to stylist ${stateData.stylistId}`);
      }
    } catch (notifyError) {
      // Don't fail the callback if notification fails
      console.error('Failed to send calendar reconnect success notification:', notifyError);
    }

    console.log(`Google Calendar connected for stylist ${stateData.stylistId}`);

    // Redirect back to dashboard with success
    return NextResponse.redirect(new URL('/dashboard?google_success=connected', request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?google_error=token_exchange_failed', request.url),
    );
  }
}

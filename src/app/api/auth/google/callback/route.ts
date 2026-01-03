import { NextResponse } from 'next/server';
import {
  updateStylistGoogleTokens,
  markStylistTokenInvalid,
  getStylistWithUser,
} from '@/lib/database';
import { sendCalendarReconnectSuccess } from '@/services/calendarReminderService';

export const dynamic = 'force-dynamic';

// Google OAuth token response type
interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

// Google userinfo response type
interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  picture?: string;
}

/**
 * Exchange authorization code for tokens using native fetch API
 * (Cloudflare Workers compatible - no Node.js https module needed)
 */
async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';

  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI || '',
    grant_type: 'authorization_code',
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || data.error) {
    throw new Error(data.error_description || data.error || 'Token exchange failed');
  }

  return data;
}

/**
 * Get user info from Google using access token
 * (Cloudflare Workers compatible - no Node.js https module needed)
 */
async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const userinfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';

  const response = await fetch(userinfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  return (await response.json()) as GoogleUserInfo;
}

/**
 * GET /api/auth/google/callback
 * Handles the OAuth2 callback from Google, exchanges code for tokens
 * Uses native fetch API for Cloudflare Workers compatibility
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
      return NextResponse.redirect(new URL('/stylist?google_error=consent_denied', request.url));
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(new URL('/stylist?google_error=missing_params', request.url));
    }

    // Decode state to get stylist info
    let stateData: { stylistId: string; userId: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(new URL('/stylist?google_error=invalid_state', request.url));
    }

    // Exchange authorization code for tokens using fetch API
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Missing tokens from Google OAuth response:', tokens);
      return NextResponse.redirect(new URL('/stylist?google_error=missing_tokens', request.url));
    }

    // Get user's email from Google using fetch API
    const userInfo = await getUserInfo(tokens.access_token);
    const googleEmail = userInfo.email || 'Unknown';

    // Calculate token expiry (expires_in is in seconds)
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

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

    // Redirect back to stylist dashboard with success
    return NextResponse.redirect(new URL('/stylist?google_success=connected', request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/stylist?google_error=token_exchange_failed', request.url),
    );
  }
}

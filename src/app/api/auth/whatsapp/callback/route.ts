import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '@/lib/sessionStore';
import { usersDB } from '@/lib/database';
import type { User } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check for OAuth errors
  if (error) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=whatsapp_oauth_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_oauth_response`);
  }

  // Verify state to prevent CSRF attacks
  const storedState = request.cookies.get('whatsapp_oauth_state')?.value;
  if (state !== storedState) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_state`);
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    const { access_token, token_type } = tokenResponse;

    if (!access_token) {
      throw new Error('No access token received');
    }

    // Get user profile information from WhatsApp Business API
    const userProfile = await getWhatsAppProfile(access_token);

    // Find or create user
    let user = usersDB.find(
      (u: User & { password: string }) => u.whatsappPhone === userProfile.phone_number,
    );

    if (!user) {
      // Create new user
      const newUser: User & { password: string } = {
        id: `wa_${Date.now()}`,
        name: userProfile.name,
        email: `${userProfile.phone_number}@whatsapp.local`,
        role: 'customer',
        authProvider: 'whatsapp',
        whatsappPhone: userProfile.phone_number,
        avatar: userProfile.profile_picture_url,
        password: 'oauth_user',
      };
      usersDB.push(newUser);
      user = newUser;
    } else {
      // Update existing user
      user.name = userProfile.name;
      user.authProvider = 'whatsapp';
      user.avatar = userProfile.profile_picture_url;
    }

    // Set session
    setSession(user);

    // Redirect to success page
    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?login=success`);

    // Clear state cookie
    response.cookies.delete('whatsapp_oauth_state');

    return response;
  } catch (error) {
    console.error('WhatsApp OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=whatsapp_oauth_failed`);
  }
}

async function exchangeCodeForToken(code: string) {
  const clientId = process.env.WHATSAPP_CLIENT_ID;
  const clientSecret = process.env.WHATSAPP_CLIENT_SECRET;
  const redirectUri =
    process.env.WHATSAPP_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/whatsapp/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('WhatsApp OAuth credentials not configured');
  }

  const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  return response.json();
}

async function getWhatsAppProfile(accessToken: string) {
  // Get business profile information
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me?fields=name,picture&access_token=${accessToken}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to get WhatsApp profile');
  }

  const profile = await response.json();

  // For WhatsApp Business API, we need to get phone number from business profile
  // This is a simplified version - in real implementation you might need to
  // call different endpoints based on your WhatsApp Business setup
  return {
    name: profile.name || 'WhatsApp User',
    phone_number: '+1234567890', // This would come from your WhatsApp Business profile
    profile_picture_url: profile.picture?.data?.url,
  };
}

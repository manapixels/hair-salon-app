import { NextRequest, NextResponse } from 'next/server';

// WhatsApp OAuth initiation endpoint
export async function GET(request: NextRequest) {
  const clientId = process.env.WHATSAPP_CLIENT_ID;
  const redirectUri =
    process.env.WHATSAPP_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/whatsapp/callback`;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'WhatsApp OAuth configuration missing' }, { status: 500 });
  }

  const scopes = 'whatsapp_business_management,whatsapp_business_messaging';
  const state = generateSecureState(); // Prevent CSRF attacks

  // Store state in session or database for verification
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}&response_type=code`;

  // Set state in cookie for later verification
  const response = NextResponse.redirect(authUrl);
  response.cookies.set('whatsapp_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });

  return response;
}

function generateSecureState(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

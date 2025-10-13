import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

/**
 * Generates a one-time login token for Telegram deep-link authentication
 * User will be redirected to: https://t.me/YOUR_BOT?start=login_TOKEN
 */

// In-memory store for login tokens (use Redis in production)
const loginTokens = new Map<
  string,
  {
    timestamp: number;
    expiresAt: Date;
  }
>();

export async function POST(request: NextRequest) {
  try {
    // Generate a secure random token
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store token
    loginTokens.set(token, {
      timestamp: Date.now(),
      expiresAt,
    });

    // Clean up expired tokens
    const now = Date.now();
    const keysToDelete: string[] = [];
    loginTokens.forEach((value, key) => {
      if (value.expiresAt.getTime() < now) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => loginTokens.delete(key));

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error generating login token:', error);
    return NextResponse.json({ error: 'Failed to generate login token' }, { status: 500 });
  }
}

// Export the token store for webhook handler to access
export { loginTokens };

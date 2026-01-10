/**
 * API Route: /api/auth/magic-link/verify
 * Verify magic link token and create session
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(`${baseUrl}/?error=missing_token`);
    }

    const db = await getDb();

    // Find valid token
    const tokenResult = await db
      .select({
        id: schema.loginTokens.id,
        userId: schema.loginTokens.userId,
        status: schema.loginTokens.status,
        expiresAt: schema.loginTokens.expiresAt,
      })
      .from(schema.loginTokens)
      .where(and(eq(schema.loginTokens.token, token), gt(schema.loginTokens.expiresAt, new Date())))
      .limit(1);

    if (tokenResult.length === 0 || tokenResult[0].status !== 'PENDING') {
      return NextResponse.redirect(`${baseUrl}/?error=invalid_or_expired_token`);
    }

    const loginToken = tokenResult[0];

    if (!loginToken.userId) {
      return NextResponse.redirect(`${baseUrl}/?error=user_not_found`);
    }

    // Get user
    const userResult = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        roles: schema.users.roles,
      })
      .from(schema.users)
      .where(eq(schema.users.id, loginToken.userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.redirect(`${baseUrl}/?error=user_not_found`);
    }

    const user = userResult[0];

    // Delete the used token
    await db.delete(schema.loginTokens).where(eq(schema.loginTokens.id, loginToken.id));

    // Create JWT session
    const sessionToken = await new SignJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(`${SESSION_DURATION}s`)
      .setIssuedAt()
      .sign(JWT_SECRET);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION,
      path: '/',
    });

    // Redirect to home with success
    return NextResponse.redirect(`${baseUrl}/?loginSuccess=true`);
  } catch (error) {
    console.error('[MagicLink] Verify error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=login_failed`);
  }
}

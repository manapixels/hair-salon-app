import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import type { User } from '@/types';

// Session configuration
const SESSION_COOKIE_NAME = 'luxecuts_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production',
);

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER';
  authProvider: 'whatsapp' | 'telegram' | 'email';
  sessionId: string;
  iat: number;
  exp: number;
}

/**
 * Creates a secure JWT session token
 */
export async function createSession(user: User): Promise<string> {
  const sessionId = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + Math.floor(SESSION_DURATION / 1000);

  const sessionData: Omit<SessionData, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    authProvider: user.authProvider as 'whatsapp' | 'telegram' | 'email',
    sessionId,
  };

  const jwt = await new SignJWT(sessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setIssuer('luxecuts-salon')
    .setAudience('luxecuts-users')
    .sign(JWT_SECRET_KEY);

  return jwt;
}

/**
 * Verifies and decodes a JWT session token
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY, {
      issuer: 'luxecuts-salon',
      audience: 'luxecuts-users',
    });

    return payload as unknown as SessionData;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

/**
 * Sets a secure HTTP-only session cookie
 */
export async function setSessionCookie(user: User): Promise<void> {
  const token = await createSession(user);
  const cookieStore = cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  });
}

/**
 * Gets session data from HTTP-only cookie
 * Fetches fresh user data from database to ensure role changes are reflected
 */
export async function getSessionFromCookie(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const sessionData = await verifySession(sessionCookie.value);
    if (!sessionData) {
      return null;
    }

    // Fetch fresh user data from database to get latest role and other updates
    // This ensures admin promotions and other changes are reflected immediately
    const { findUserById } = await import('./database');
    const freshUser = await findUserById(sessionData.userId);

    if (!freshUser) {
      // User was deleted from database, invalidate session
      return null;
    }

    return freshUser;
  } catch (error) {
    console.error('Failed to get session from cookie:', error);
    return null;
  }
}

/**
 * Clears the session cookie
 */
export function clearSessionCookie(): void {
  const cookieStore = cookies();

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Expire immediately
    path: '/',
  });
}

/**
 * Refreshes a session by extending its expiration
 */
export async function refreshSession(currentUser: User): Promise<void> {
  await setSessionCookie(currentUser);
}

/**
 * Validates if a session should be refreshed (refresh when 50% of time has passed)
 */
export function shouldRefreshSession(sessionData: SessionData): boolean {
  const now = Math.floor(Date.now() / 1000);
  const sessionAge = now - sessionData.iat;
  const sessionDuration = sessionData.exp - sessionData.iat;

  return sessionAge > sessionDuration * 0.5;
}

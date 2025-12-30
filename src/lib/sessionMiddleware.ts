import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionFromCookie,
  refreshSession,
  shouldRefreshSession,
  clearSessionCookie,
} from './secureSession';
import type { User } from '@/types';
import { isAdmin } from '@/lib/roleHelpers';

export interface SessionRequest extends NextRequest {
  user?: User;
  sessionData?: any;
}

/**
 * Validates session and attaches user data to request
 */
export async function validateSession(
  request: NextRequest,
): Promise<{ user: User | null; shouldRefresh: boolean }> {
  try {
    const user = await getSessionFromCookie();

    if (!user) {
      return { user: null, shouldRefresh: false };
    }

    // Check if session should be refreshed
    const sessionCookie = request.cookies.get('luxecuts_session');
    let shouldRefresh = false;

    if (sessionCookie?.value) {
      // This would require importing verifySession, but for now we'll refresh every hour
      const lastRefresh = request.cookies.get('luxecuts_last_refresh')?.value;
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (!lastRefresh || now - parseInt(lastRefresh) > oneHour) {
        shouldRefresh = true;
      }
    }

    return { user, shouldRefresh };
  } catch (error) {
    console.error('Session validation error:', error);
    return { user: null, shouldRefresh: false };
  }
}

/**
 * Middleware for API routes that require authentication
 */
export function withAuth(
  handler: (request: NextRequest, context: { user: User }) => Promise<NextResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { user, shouldRefresh } = await validateSession(request);

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const response = await handler(request, { user });

    // Refresh session if needed
    if (shouldRefresh) {
      try {
        await refreshSession(user);
        response.cookies.set('luxecuts_last_refresh', Date.now().toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        });
      } catch (error) {
        console.error('Failed to refresh session:', error);
      }
    }

    return response;
  };
}

/**
 * Middleware for API routes that require admin role
 */
export function withAdminAuth(
  handler: (request: NextRequest, context: { user: User }) => Promise<NextResponse>,
) {
  return withAuth(async (request: NextRequest, context: { user: User }) => {
    if (!isAdmin(context.user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return handler(request, context);
  });
}

/**
 * Middleware that adds optional session data (doesn't require auth)
 */
export function withOptionalAuth(
  handler: (request: NextRequest, context: { user: User | null }) => Promise<NextResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { user, shouldRefresh } = await validateSession(request);

    const response = await handler(request, { user });

    // Refresh session if user exists and should refresh
    if (user && shouldRefresh) {
      try {
        await refreshSession(user);
        response.cookies.set('luxecuts_last_refresh', Date.now().toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        });
      } catch (error) {
        console.error('Failed to refresh session:', error);
      }
    }

    return response;
  };
}

/**
 * Utility to get current user from cookie (for use in API routes)
 */
export async function getCurrentUser(): Promise<User | null> {
  return await getSessionFromCookie();
}

/**
 * Logout utility for API routes
 */
export function logoutUser(): NextResponse {
  const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });

  clearSessionCookie();

  // Clear refresh tracking cookie
  response.cookies.set('luxecuts_last_refresh', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}

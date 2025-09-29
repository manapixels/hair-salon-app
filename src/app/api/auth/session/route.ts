/**
 * API Route: /api/auth/session
 * Checks if there is an active session using secure cookies.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withOptionalAuth } from '@/lib/sessionMiddleware';

export const GET = withOptionalAuth(async (request: NextRequest, { user }) => {
  if (user) {
    return NextResponse.json(user, { status: 200 });
  } else {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
});

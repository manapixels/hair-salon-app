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

// Support HEAD and OPTIONS for CORS/preflight
export const HEAD = GET;

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, HEAD, OPTIONS',
    },
  });
}

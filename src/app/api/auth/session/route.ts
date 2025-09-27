/**
 * API Route: /api/auth/session
 * Checks if there is an active session.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../lib/sessionStore';

export async function GET(request: NextRequest) {
  const session = getSession();
  if (session) {
    return NextResponse.json(session, { status: 200 });
  } else {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
}

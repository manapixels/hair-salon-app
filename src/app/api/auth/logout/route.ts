/**
 * API Route: /api/auth/logout
 * Clears secure session cookies.
 */
import { NextRequest } from 'next/server';
import { logoutUser } from '@/lib/sessionMiddleware';

export async function POST(request: NextRequest) {
  return logoutUser();
}

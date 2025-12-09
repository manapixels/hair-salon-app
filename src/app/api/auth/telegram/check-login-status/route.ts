/**
 * API Route: /api/auth/telegram/check-login-status
 *
 * Polling endpoint for the original browser to check if login is complete.
 * Returns the status of the login token.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ status: 'not_found' }, { status: 400 });
  }

  try {
    const db = await getDb();
    const tokenResults = await db
      .select({
        status: schema.loginTokens.status,
        expiresAt: schema.loginTokens.expiresAt,
        userId: schema.loginTokens.userId,
      })
      .from(schema.loginTokens)
      .where(eq(schema.loginTokens.token, token))
      .limit(1);

    const tokenData = tokenResults[0];

    if (!tokenData) {
      return NextResponse.json({ status: 'not_found' });
    }

    // Check if token is expired
    if (tokenData.expiresAt.getTime() < Date.now()) {
      // Clean up expired token
      await db.delete(schema.loginTokens).where(eq(schema.loginTokens.token, token));
      return NextResponse.json({ status: 'expired' });
    }

    // Return current status
    // Status is 'PENDING' until user clicks "Complete Login" in Telegram,
    // then it becomes 'COMPLETED' and ready for original browser to claim
    return NextResponse.json({
      status: tokenData.status.toLowerCase(),
      hasUser: !!tokenData.userId,
    });
  } catch (error) {
    console.error('[CHECK-LOGIN-STATUS] Error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

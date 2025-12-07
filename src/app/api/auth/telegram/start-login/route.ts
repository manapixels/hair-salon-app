import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { lt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  console.log('[START-LOGIN] Generating new login token...');

  try {
    const db = await getDb();
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('[START-LOGIN] Token generated (redacted):', token.substring(0, 10) + '...');
    console.log('[START-LOGIN] Expires at:', expiresAt);

    const result = await db
      .insert(schema.loginTokens)
      .values({
        token,
        expiresAt,
      })
      .returning();

    const createdToken = result[0];
    console.log('[START-LOGIN] Token saved to database with ID:', createdToken.id);

    // Clean up expired tokens
    const deleted = await db
      .delete(schema.loginTokens)
      .where(lt(schema.loginTokens.expiresAt, new Date()))
      .returning();

    console.log('[START-LOGIN] Cleaned up', deleted.length, 'expired tokens');

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[START-LOGIN] ERROR generating login token:', error);
    return NextResponse.json({ error: 'Failed to generate login token' }, { status: 500 });
  }
}

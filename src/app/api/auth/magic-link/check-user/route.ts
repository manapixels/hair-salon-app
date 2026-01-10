/**
 * API Route: /api/auth/magic-link/check-user
 * Check if email exists in the system
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email: string };

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = await getDb();
    const normalizedEmail = email.toLowerCase().trim();

    const user = await db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (user.length > 0) {
      return NextResponse.json({ exists: true, name: user[0].name });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('[MagicLink] Check user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

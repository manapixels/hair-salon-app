import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * API Route: /api/auth/whatsapp/check-user
 * Checks if a user exists with the given WhatsApp phone number
 */
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = (await request.json()) as { phoneNumber: string };

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const db = await getDb();

    // Check if user exists with this WhatsApp phone number
    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
      })
      .from(schema.users)
      .where(eq(schema.users.whatsappPhone, phoneNumber))
      .limit(1);

    const existingUser = users[0];

    return NextResponse.json({
      exists: !!existingUser,
      name: existingUser?.name || null,
    });
  } catch (error) {
    console.error('User check error:', error);
    // Return false on error to not block login flow
    return NextResponse.json({ exists: false, name: null });
  }
}

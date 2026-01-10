/**
 * API Route: /api/auth/magic-link/request
 * Request a magic link login email
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getAdminSettings } from '@/lib/database';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendMagicLinkEmail } from '@/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = (await request.json()) as { email: string; name?: string };

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const db = await getDb();
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    let userId: string | undefined;
    const existingUser = await db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else if (name) {
      // Create new user if name provided
      const newUser = await db
        .insert(schema.users)
        .values({
          email: normalizedEmail,
          name: name.trim(),
          authProvider: 'email',
        })
        .returning({ id: schema.users.id });
      userId = newUser[0].id;
    } else {
      // User doesn't exist and no name provided - request name
      return NextResponse.json(
        { error: 'New user - please provide your name', isNewUser: true },
        { status: 400 },
      );
    }

    // Generate token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token using existing loginTokens table
    await db.insert(schema.loginTokens).values({
      token,
      userId,
      expiresAt,
      status: 'PENDING',
    });

    // Send magic link email
    const userName = existingUser[0]?.name || name;
    const settings = await getAdminSettings();
    const emailResult = await sendMagicLinkEmail(normalizedEmail, token, userName, {
      businessName: settings.businessName,
      businessAddress: settings.businessAddress,
      businessPhone: settings.businessPhone,
    });

    if (!emailResult.success) {
      console.error('[MagicLink] Failed to send email:', emailResult.error);
      // In development, still return success for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('[MagicLink] Dev mode - token:', token);
        return NextResponse.json({ success: true, message: 'Magic link generated (dev mode)' });
      }
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Magic link sent' });
  } catch (error) {
    console.error('[MagicLink] Request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

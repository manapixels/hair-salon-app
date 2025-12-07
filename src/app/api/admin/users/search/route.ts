/**
 * API Route: /api/admin/users/search
 * Search users for promotion to stylist role
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { sql, asc, not, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const excludeStylists = searchParams.get('excludeStylists') === 'true';

    // Get all users and filter in JavaScript (Drizzle doesn't have built-in ilike OR)
    let users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        authProvider: schema.users.authProvider,
        whatsappPhone: schema.users.whatsappPhone,
        telegramId: schema.users.telegramId,
        avatar: schema.users.avatar,
      })
      .from(schema.users)
      .orderBy(asc(schema.users.name));

    // Filter by query
    if (query) {
      const lowerQuery = query.toLowerCase();
      users = users.filter(
        u =>
          u.name.toLowerCase().includes(lowerQuery) ||
          u.email.toLowerCase().includes(lowerQuery) ||
          (u.whatsappPhone && u.whatsappPhone.toLowerCase().includes(lowerQuery)),
      );
    }

    // Exclude stylists if requested
    if (excludeStylists) {
      users = users.filter(u => u.role !== 'STYLIST');
    }

    // Limit results
    users = users.slice(0, 20);

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to search users' },
      { status: 500 },
    );
  }
}

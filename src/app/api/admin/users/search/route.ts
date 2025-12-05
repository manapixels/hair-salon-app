/**
 * API Route: /api/admin/users/search
 * Search users for promotion to stylist role
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const excludeStylists = searchParams.get('excludeStylists') === 'true';

    // Build where clause
    const whereClause: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { whatsappPhone: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Optionally exclude users who are already stylists
    if (excludeStylists) {
      whereClause.role = { not: 'STYLIST' };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        authProvider: true,
        whatsappPhone: true,
        telegramId: true,
        avatar: true,
      },
      take: 20, // Limit results
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to search users' },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/services/tags
 * Returns all service tags grouped by category
 */
export async function GET() {
  try {
    const tags = await prisma.serviceTag.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    // Group tags by category
    const grouped = {
      concerns: tags.filter(tag => tag.category === 'CONCERN'),
      outcomes: tags.filter(tag => tag.category === 'OUTCOME'),
      hairTypes: tags.filter(tag => tag.category === 'HAIR_TYPE'),
    };

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error fetching service tags:', error);
    return NextResponse.json({ error: 'Failed to fetch service tags' }, { status: 500 });
  }
}

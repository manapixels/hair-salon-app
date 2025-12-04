import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

/**
 * GET /api/services/tags
 * Returns all service tags grouped by category
 */

const getServiceTags = unstable_cache(
  async () => {
    const tags = await prisma.serviceTag.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    return {
      concerns: tags.filter(tag => tag.category === 'CONCERN'),
      outcomes: tags.filter(tag => tag.category === 'OUTCOME'),
      hairTypes: tags.filter(tag => tag.category === 'HAIR_TYPE'),
    };
  },
  ['service-tags'],
  {
    tags: ['service-tags'],
    revalidate: false,
  },
);

export async function GET() {
  try {
    const grouped = await getServiceTags();
    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error fetching service tags:', error);
    return NextResponse.json({ error: 'Failed to fetch service tags' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { asc } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

/**
 * GET /api/services/tags/concerns
 * Returns all service tags grouped by category
 */

const getConcernTags = unstable_cache(
  async () => {
    const db = await getDb();
    const tags = await db
      .select()
      .from(schema.serviceTags)
      .orderBy(asc(schema.serviceTags.category), asc(schema.serviceTags.sortOrder));

    return {
      concerns: tags.filter(tag => tag.category === 'CONCERN'),
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
    const grouped = await getConcernTags();
    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error fetching service tags:', error);
    return NextResponse.json({ error: 'Failed to fetch service tags' }, { status: 500 });
  }
}

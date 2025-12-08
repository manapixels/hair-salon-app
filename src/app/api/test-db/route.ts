import { NextResponse } from 'next/server';
import { getServiceCategories } from '@/lib/database';

export async function GET() {
  try {
    const categories = await getServiceCategories();
    // Return just the first category's items to check structure
    const firstCategoryWithItems = categories.find(c => c.items.length > 0);
    const firstService = firstCategoryWithItems?.items[0];

    return NextResponse.json({
      serviceName: firstService?.name,
      serviceTags: firstService?.serviceTags,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

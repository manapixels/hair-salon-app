import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tagSlugs = searchParams.get('tags')?.split(',').filter(Boolean) || [];

    // Fetch categories with items and tags
    const categories = await prisma.serviceCategory.findMany({
      include: {
        items: {
          where: { isActive: true },
          include: {
            addons: true,
            serviceTags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

    // Client-side filtering by tags if tags are provided
    if (tagSlugs.length > 0) {
      const filteredCategories = categories
        .map(category => ({
          ...category,
          items: category.items.filter(service =>
            service.serviceTags.some(st => tagSlugs.includes(st.tag.slug)),
          ),
        }))
        .filter(category => category.items.length > 0);

      return NextResponse.json(filteredCategories);
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

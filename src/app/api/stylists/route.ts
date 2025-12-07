/**
 * API Route: /api/stylists
 *
 * Handles stylist CRUD operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { getStylists, getStylistsForCategory, createStylist } from '../../../lib/database';
import { getAllCategories } from '../../../lib/categories';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');

    if (categoryId) {
      // Filter stylists by category specialty
      const stylists = await getStylistsForCategory(categoryId);
      return NextResponse.json(stylists, { status: 200 });
    } else {
      // Return all stylists
      const stylists = await getStylists();
      return NextResponse.json(stylists, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error fetching stylists:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch stylists.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name: string;
      email: string;
      bio?: string;
      avatar?: string;
      specialtyCategoryIds: string[];
      workingHours?: any;
      userId?: string;
    };
    const { name, email, bio, avatar, specialtyCategoryIds, workingHours, userId } = body;

    if (!name || !Array.isArray(specialtyCategoryIds)) {
      return NextResponse.json(
        {
          message: 'Missing required fields: name and specialtyCategoryIds are required.',
        },
        { status: 400 },
      );
    }

    // Validate that all category IDs exist
    const allCategories = await getAllCategories();
    const validCategoryIds = specialtyCategoryIds.filter((id: string) =>
      allCategories.some(category => category.id === id),
    );

    if (validCategoryIds.length !== specialtyCategoryIds.length) {
      return NextResponse.json({ message: 'Some category IDs are invalid.' }, { status: 400 });
    }

    const newStylist = await createStylist({
      name,
      email,
      bio,
      avatar,
      specialtyCategoryIds: validCategoryIds,
      workingHours,
      userId, // Link to user account if promoting existing user
    });

    return NextResponse.json(newStylist, { status: 201 });
  } catch (error: any) {
    console.error('Error creating stylist:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create stylist.' },
      { status: 500 },
    );
  }
}

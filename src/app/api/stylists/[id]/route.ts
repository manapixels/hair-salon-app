/**
 * API Route: /api/stylists/[id]
 *
 * Handles individual stylist operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { getStylistById, updateStylist, deleteStylist } from '../../../../lib/database';
import { getAllCategories } from '../../../../lib/categories';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const stylist = await getStylistById(params.id);

    if (!stylist) {
      return NextResponse.json({ message: 'Stylist not found.' }, { status: 404 });
    }

    return NextResponse.json(stylist, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching stylist:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch stylist.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      bio?: string;
      avatar?: string;
      specialtyCategoryIds?: string[];
      workingHours?: any;
      blockedDates?: any[];
      isActive?: boolean;
    };
    const { name, email, bio, avatar, specialtyCategoryIds, workingHours, blockedDates, isActive } =
      body;

    // Validate category IDs if provided
    if (specialtyCategoryIds && Array.isArray(specialtyCategoryIds)) {
      const allCategories = await getAllCategories();
      const validCategoryIds = specialtyCategoryIds.filter((id: string) =>
        allCategories.some(category => category.id === id),
      );

      if (validCategoryIds.length !== specialtyCategoryIds.length) {
        return NextResponse.json({ message: 'Some category IDs are invalid.' }, { status: 400 });
      }
    }

    const updatedStylist = await updateStylist(params.id, {
      name,
      email,
      bio,
      avatar,
      specialtyCategoryIds,
      workingHours,
      blockedDates,
      isActive,
    });

    return NextResponse.json(updatedStylist, { status: 200 });
  } catch (error: any) {
    console.error('Error updating stylist:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update stylist.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await deleteStylist(params.id);

    return NextResponse.json({ message: 'Stylist deleted successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting stylist:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete stylist.' },
      { status: 500 },
    );
  }
}

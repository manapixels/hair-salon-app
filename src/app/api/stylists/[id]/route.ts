/**
 * API Route: /api/stylists/[id]
 *
 * Handles individual stylist operations
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getStylistById,
  updateStylist,
  deleteStylist,
  getServices,
} from '../../../../lib/database';

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
    const body = await request.json();
    const { name, email, bio, avatar, specialtyIds, workingHours, isActive } = body;

    // Validate specialty IDs if provided
    if (specialtyIds && Array.isArray(specialtyIds)) {
      const allServices = await getServices();
      const validSpecialtyIds = specialtyIds.filter(id =>
        allServices.some(service => service.id === id),
      );

      if (validSpecialtyIds.length !== specialtyIds.length) {
        return NextResponse.json({ message: 'Some specialty IDs are invalid.' }, { status: 400 });
      }
    }

    const updatedStylist = await updateStylist(params.id, {
      name,
      email,
      bio,
      avatar,
      specialtyIds,
      workingHours,
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

/**
 * API Route: /api/stylists
 *
 * Handles stylist CRUD operations
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getStylists,
  getStylistsForServices,
  createStylist,
  getServices,
} from '../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const services = searchParams.get('services');

    if (services) {
      // Filter stylists by services
      const serviceIds = services
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));
      const stylists = await getStylistsForServices(serviceIds);
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
    const body = await request.json();
    const { name, email, bio, avatar, specialtyIds, workingHours } = body;

    if (!name || !email || !Array.isArray(specialtyIds)) {
      return NextResponse.json(
        { message: 'Missing required fields: name, email, and specialtyIds are required.' },
        { status: 400 },
      );
    }

    // Validate that all specialty IDs exist
    const allServices = await getServices();
    const validSpecialtyIds = specialtyIds.filter(id =>
      allServices.some(service => service.id === id),
    );

    if (validSpecialtyIds.length !== specialtyIds.length) {
      return NextResponse.json({ message: 'Some specialty IDs are invalid.' }, { status: 400 });
    }

    const newStylist = await createStylist({
      name,
      email,
      bio,
      avatar,
      specialtyIds: validSpecialtyIds,
      workingHours,
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

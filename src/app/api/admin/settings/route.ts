/**
 * API Route: /api/admin/settings
 * Handles getting and updating admin settings.
 */
import { NextResponse } from 'next/server';
import {
  getAdminSettings,
  updateAdminSettings as dbUpdateAdminSettings,
} from '../../../../lib/database';

// GET /api/admin/settings
export async function GET() {
  try {
    const settings = getAdminSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/admin/settings
export async function POST(request: Request) {
  try {
    const requestBody = await request.json();

    if (!requestBody) {
      return NextResponse.json({ message: 'Bad Request: Missing request body.' }, { status: 400 });
    }

    const updatedSettings = dbUpdateAdminSettings(requestBody);
    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

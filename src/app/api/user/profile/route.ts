import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/sessionStore';
import { updateUserProfile } from '@/lib/database';

export async function PATCH(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (name.trim().length > 50) {
      return NextResponse.json({ error: 'Name must be 50 characters or less' }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await updateUserProfile(session.id, {
      name: name.trim(),
    });

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: updatedUser,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

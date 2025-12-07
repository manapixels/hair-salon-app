import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/sessionMiddleware';
import { updateUserProfile } from '@/lib/database';
import { setSessionCookie } from '@/lib/secureSession';

export const PATCH = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = (await request.json()) as { name: string };
    const { name } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (name.trim().length > 50) {
      return NextResponse.json({ error: 'Name must be 50 characters or less' }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await updateUserProfile(user.id, {
      name: name.trim(),
    });

    // Update session with new user data
    await setSessionCookie(updatedUser);

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
});

/**
 * API Route: /api/admin/data-integrity/check
 * Validates data consistency between users and stylists tables
 */
import { NextResponse } from 'next/server';
import { validateRoleStylistConsistency } from '@/lib/database';
import { getSessionFromCookie } from '@/lib/secureSession';
import { isAdmin } from '@/lib/roleHelpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check admin authentication
    const user = await getSessionFromCookie();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await validateRoleStylistConsistency();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error validating data integrity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate data integrity' },
      { status: 500 },
    );
  }
}

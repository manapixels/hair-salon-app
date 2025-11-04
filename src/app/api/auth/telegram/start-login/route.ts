import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log('[START-LOGIN] Generating new login token...');

  try {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('[START-LOGIN] Token generated (redacted):', token.substring(0, 10) + '...');
    console.log('[START-LOGIN] Expires at:', expiresAt);

    const createdToken = await prisma.loginToken.create({
      data: {
        token,
        expiresAt,
      },
    });

    console.log('[START-LOGIN] Token saved to database with ID:', createdToken.id);

    // Clean up expired tokens
    const deletedCount = await prisma.loginToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log('[START-LOGIN] Cleaned up', deletedCount.count, 'expired tokens');

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[START-LOGIN] ERROR generating login token:', error);
    return NextResponse.json({ error: 'Failed to generate login token' }, { status: 500 });
  }
}

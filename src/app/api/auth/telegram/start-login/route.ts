import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.loginToken.create({
      data: {
        token,
        expiresAt,
      },
    });

    // Clean up expired tokens
    await prisma.loginToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error generating login token:', error);
    return NextResponse.json({ error: 'Failed to generate login token' }, { status: 500 });
  }
}

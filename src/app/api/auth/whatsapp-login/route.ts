import { NextResponse } from 'next/server';

// This endpoint is deprecated - use /api/auth/whatsapp instead
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use WhatsApp OAuth flow via /api/auth/whatsapp' },
    { status: 410 },
  );
}

import { NextResponse } from 'next/server';

// This endpoint is deprecated - use Telegram Login Widget via /api/auth/telegram instead
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use Telegram Login Widget via /api/auth/telegram' },
    { status: 410 },
  );
}

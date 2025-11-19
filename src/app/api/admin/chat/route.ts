import { NextResponse } from 'next/server';
import { getFlaggedConversations } from '@/services/adminChatService';

export async function GET() {
  try {
    const conversations = await getFlaggedConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching flagged conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch flagged conversations' }, { status: 500 });
  }
}

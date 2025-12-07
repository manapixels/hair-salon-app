import { NextRequest, NextResponse } from 'next/server';
import {
  getAllKnowledgeBaseItems,
  addToKnowledgeBase,
  deleteKnowledgeBaseItem,
} from '@/services/knowledgeBaseService';

export async function GET() {
  try {
    const items = await getAllKnowledgeBaseItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge base' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { question: string; answer: string; tags?: string[] };
    const { question, answer, tags } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    const newItem = await addToKnowledgeBase(question, answer, tags || []);
    return NextResponse.json(newItem);
  } catch (error) {
    console.error('Error adding to knowledge base:', error);
    return NextResponse.json({ error: 'Failed to add to knowledge base' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await deleteKnowledgeBaseItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting from knowledge base:', error);
    return NextResponse.json({ error: 'Failed to delete from knowledge base' }, { status: 500 });
  }
}

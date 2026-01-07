import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import ChatClient from './ChatClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'chat');
}

export default function ChatPage() {
  return <ChatClient />;
}

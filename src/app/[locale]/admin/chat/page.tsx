import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import ChatDashboard from './_components/ChatDashboard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'chat');
}

export default function ChatPage() {
  return <ChatDashboard />;
}

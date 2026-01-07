import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import KnowledgeBaseClient from './KnowledgeBaseClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'knowledgeBase');
}

export default function KnowledgeBasePage() {
  return <KnowledgeBaseClient />;
}

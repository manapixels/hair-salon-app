import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import StylistManagement from './_components/StylistManagement';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'stylists');
}

export default function StylistsPage() {
  return <StylistManagement onClose={() => {}} showAddModal={false} setShowAddModal={() => {}} />;
}

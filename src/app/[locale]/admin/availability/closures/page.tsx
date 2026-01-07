import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import SpecialClosuresPage from '@/components/admin/availability/pages/SpecialClosuresPage';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'availability', 'closures');
}

export default function AvailabilityClosuresRoute() {
  return <SpecialClosuresPage />;
}

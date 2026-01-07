import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import StylistAvailabilityPage from '@/components/admin/availability/pages/StylistAvailabilityPage';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'availability', 'stylists');
}

export default function AvailabilityStylistsRoute() {
  return <StylistAvailabilityPage />;
}

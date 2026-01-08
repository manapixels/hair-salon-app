import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import BusinessHours from './_components/BusinessHours';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'availability', 'hours');
}

export default function AvailabilityHoursRoute() {
  return <BusinessHours />;
}

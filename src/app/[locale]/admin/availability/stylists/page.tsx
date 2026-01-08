import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import StylistAvailability from './_components/StylistAvailability';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'availability', 'stylists');
}

export default function AvailabilityStylistsRoute() {
  return <StylistAvailability />;
}

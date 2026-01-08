import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import ServicesManager from './_components/ServicesManager';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'settings', 'services');
}

export default function SettingsServicesRoute() {
  return <ServicesManager />;
}

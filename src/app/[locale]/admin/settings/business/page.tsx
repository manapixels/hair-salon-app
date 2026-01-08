import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import BusinessInfo from './_components/BusinessInfo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'settings', 'business');
}

export default function SettingsBusinessRoute() {
  return <BusinessInfo />;
}

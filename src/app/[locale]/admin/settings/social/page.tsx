import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import SocialLinks from './_components/SocialLinks';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'settings', 'social');
}

export default function SettingsSocialRoute() {
  return <SocialLinks />;
}

import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import MyProfileClient from './MyProfileClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'myProfile');
}

export default function MyProfilePage() {
  return <MyProfileClient />;
}

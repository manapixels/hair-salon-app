import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/metadata';
import CustomerDashboard from './_components/CustomerDashboard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return publicPageMetadata(locale, 'customer');
}

export default function CustomerRoute() {
  return <CustomerDashboard />;
}

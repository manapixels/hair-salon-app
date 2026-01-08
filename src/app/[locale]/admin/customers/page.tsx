import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import CustomersList from './_components/CustomersList';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'customers');
}

export default function CustomersPage() {
  return <CustomersList />;
}

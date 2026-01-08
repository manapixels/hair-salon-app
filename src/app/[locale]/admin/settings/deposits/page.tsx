import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import DepositSettings from './_components/DepositSettings';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'settings', 'deposits');
}

export default function SettingsDepositsRoute() {
  return <DepositSettings />;
}

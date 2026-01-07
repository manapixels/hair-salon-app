'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import StylistAvailability from '@/components/admin/availability/StylistAvailability';

export default function StylistAvailabilityPage() {
  const router = useRouter();
  const locale = useLocale();

  return (
    <StylistAvailability onNavigateToStylists={() => router.push(`/${locale}/admin/stylists`)} />
  );
}

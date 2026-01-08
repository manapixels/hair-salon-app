'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import AvailabilityCalendar from './AvailabilityCalendar';

export default function StylistAvailability() {
  const router = useRouter();
  const locale = useLocale();

  return (
    <AvailabilityCalendar onNavigateToStylists={() => router.push(`/${locale}/admin/stylists`)} />
  );
}

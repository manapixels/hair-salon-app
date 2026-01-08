'use client';

import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { useTranslations } from 'next-intl';

export default function Loading() {
  const t = useTranslations('Admin.Availability');

  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <LoadingSpinner size="lg" message={t('loadingAdmin')} />
    </div>
  );
}

'use client';

import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { StylistCardSkeleton } from '@/components/feedback/loaders/StylistCardSkeleton';
import { useTranslations } from 'next-intl';

export const StylistSelectorLoading = () => {
  const t = useTranslations('BookingForm');
  return (
    <div className="scroll-mt-24">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">{t('step2')}</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <LoadingSpinner size="sm" />
          <p className="text-sm text-gray-600">{t('loadingStylists')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StylistCardSkeleton count={3} />
        </div>
      </div>
    </div>
  );
};

export const DateTimePickerLoading = () => {
  const t = useTranslations('BookingForm');
  return (
    <div>
      <h2 className="text-lg font-semibold mb-6 text-gray-800">{t('step3')}</h2>
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner message={t('loadingCalendar')} />
      </div>
    </div>
  );
};

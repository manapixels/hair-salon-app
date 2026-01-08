'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBooking } from '@/context/BookingContext';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import ClosuresManager from './ClosuresManager';
import { LoadingButton } from '@/components/feedback/loaders/LoadingButton';
import { toast } from 'sonner';
import type { BlockedPeriod } from '@/types';

export default function SpecialClosures() {
  const t = useTranslations('Admin.Availability');
  const { adminSettings, fetchAndSetAdminSettings, saveAdminSettings } = useBooking();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [specialClosures, setSpecialClosures] = useState<BlockedPeriod[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAndSetAdminSettings();
      setLoading(false);
    };
    loadData();
  }, [fetchAndSetAdminSettings]);

  useEffect(() => {
    setSpecialClosures(adminSettings.specialClosures || []);
  }, [adminSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading(t('savingSpecialClosures'));
    try {
      await saveAdminSettings({
        ...adminSettings,
        specialClosures,
      });
      toast.success(t('specialClosuresSaved'), { id: toastId });
      router.refresh();
    } catch {
      toast.error(t('saveSpecialClosuresFailed'), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" message={t('loadingSpecialClosures')} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <ClosuresManager closures={specialClosures} onChange={setSpecialClosures} />
      <div className="mt-8 pt-6 border-t border-border flex justify-end">
        <LoadingButton
          loading={isSaving}
          loadingText={t('saving')}
          onClick={handleSave}
          className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90"
        >
          {t('saveChanges')}
        </LoadingButton>
      </div>
    </div>
  );
}

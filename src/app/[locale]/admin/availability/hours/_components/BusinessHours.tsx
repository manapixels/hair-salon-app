'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBooking } from '@/context/BookingContext';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import WeeklySchedule from './WeeklySchedule';
import { LoadingButton } from '@/components/feedback/loaders/LoadingButton';
import { toast } from 'sonner';

export default function BusinessHours() {
  const t = useTranslations('Admin.Availability');
  const { adminSettings, fetchAndSetAdminSettings, saveAdminSettings } = useBooking();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<any>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAndSetAdminSettings();
      setLoading(false);
    };
    loadData();
  }, [fetchAndSetAdminSettings]);

  useEffect(() => {
    const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const defaultDay = { isOpen: true, openingTime: '09:00', closingTime: '17:00' };
    const schedule: any = {};
    DAYS.forEach(day => {
      schedule[day] =
        adminSettings.weeklySchedule?.[day as keyof typeof adminSettings.weeklySchedule] ||
        defaultDay;
    });
    setWeeklySchedule(schedule);
  }, [adminSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading(t('savingBusinessHours'));
    try {
      await saveAdminSettings({
        ...adminSettings,
        weeklySchedule,
      });
      toast.success(t('businessHoursSaved'), { id: toastId });
      router.refresh();
    } catch {
      toast.error(t('saveBusinessHoursFailed'), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" message={t('loadingBusinessHours')} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <WeeklySchedule weeklySchedule={weeklySchedule} onChange={setWeeklySchedule} />
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

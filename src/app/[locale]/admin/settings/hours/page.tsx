'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useBooking } from '@/context/BookingContext';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import ScheduleSettings from '@/components/admin/settings/salon/ScheduleSettings';
import { LoadingButton } from '@/components/feedback/loaders/LoadingButton';
import { toast } from 'sonner';

export default function SettingsHoursPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { adminSettings, fetchAndSetAdminSettings, saveAdminSettings } = useBooking();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<any>({});

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

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
    const toastId = toast.loading('Saving settings...');
    try {
      await saveAdminSettings({
        ...adminSettings,
        weeklySchedule,
      });
      toast.success('Settings saved!', { id: toastId });
      router.refresh();
    } catch {
      toast.error('Failed to save settings', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading settings..." />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <AdminLayout title="Operating Hours">
      <div className="max-w-2xl">
        <ScheduleSettings weeklySchedule={weeklySchedule} onChange={setWeeklySchedule} />
        <div className="mt-8 pt-6 border-t border-border flex justify-end">
          <LoadingButton
            loading={isSaving}
            loadingText="Saving..."
            onClick={handleSave}
            className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90"
          >
            Save Changes
          </LoadingButton>
        </div>
      </div>
    </AdminLayout>
  );
}

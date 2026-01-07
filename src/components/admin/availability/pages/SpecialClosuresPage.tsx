'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBooking } from '@/context/BookingContext';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import ClosuresSettings from '@/components/admin/settings/salon/ClosuresSettings';
import { LoadingButton } from '@/components/feedback/loaders/LoadingButton';
import { toast } from 'sonner';
import type { BlockedPeriod } from '@/types';

export default function SpecialClosuresPage() {
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
    const toastId = toast.loading('Saving special closures...');
    try {
      await saveAdminSettings({
        ...adminSettings,
        specialClosures,
      });
      toast.success('Special closures saved!', { id: toastId });
      router.refresh();
    } catch {
      toast.error('Failed to save special closures', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" message="Loading special closures..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <ClosuresSettings closures={specialClosures} onChange={setSpecialClosures} />
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
  );
}

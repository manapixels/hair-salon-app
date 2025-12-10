'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBooking } from '@/context/BookingContext';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import BusinessSettings from '@/components/admin/settings/salon/BusinessSettings';
import { LoadingButton } from '@/components/feedback/loaders/LoadingButton';
import { toast } from 'sonner';

export default function SettingsBusinessPage() {
  const { adminSettings, fetchAndSetAdminSettings, saveAdminSettings } = useBooking();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAndSetAdminSettings();
      setLoading(false);
    };
    loadData();
  }, [fetchAndSetAdminSettings]);

  useEffect(() => {
    setBusinessName(adminSettings.businessName || '');
    setBusinessAddress(adminSettings.businessAddress || '');
    setBusinessPhone(adminSettings.businessPhone || '');
  }, [adminSettings]);

  const handleFieldChange = (
    field: 'businessName' | 'businessAddress' | 'businessPhone',
    value: string,
  ) => {
    if (field === 'businessName') setBusinessName(value);
    else if (field === 'businessAddress') setBusinessAddress(value);
    else if (field === 'businessPhone') setBusinessPhone(value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Saving settings...');
    try {
      await saveAdminSettings({
        ...adminSettings,
        businessName,
        businessAddress,
        businessPhone,
      });
      toast.success('Settings saved!', { id: toastId });
      router.refresh();
    } catch {
      toast.error('Failed to save settings', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" message="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <BusinessSettings
        businessName={businessName}
        businessAddress={businessAddress}
        businessPhone={businessPhone}
        onChange={handleFieldChange}
      />
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

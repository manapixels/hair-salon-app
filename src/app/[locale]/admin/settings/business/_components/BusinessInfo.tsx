'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBooking } from '@/context/BookingContext';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { LoadingButton } from '@/components/feedback/loaders/LoadingButton';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function BusinessInfo() {
  const t = useTranslations('Admin.Settings.Business');
  const tSettings = useTranslations('Admin.Settings');
  const tCommon = useTranslations('Admin.Common');

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
      try {
        await fetchAndSetAdminSettings();
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error(t('loadError'));
      }
      setLoading(false);
    };
    loadData();
  }, [fetchAndSetAdminSettings, t]);

  useEffect(() => {
    setBusinessName(adminSettings.businessName || '');
    setBusinessAddress(adminSettings.businessAddress || '');
    setBusinessPhone(adminSettings.businessPhone || '');
  }, [adminSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading(tSettings('saving'));
    try {
      await saveAdminSettings({
        ...adminSettings,
        businessName,
        businessAddress,
        businessPhone,
      });
      toast.success(t('saved'), { id: toastId });
      router.refresh();
    } catch {
      toast.error(t('saveError'), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" message={tCommon('loading')} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl text-left">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">{t('title')}</h2>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>

        <div className="grid w-full max-w-sm items-center gap-3 text-left">
          <Label className="text-left">{t('businessName')}</Label>
          <Input
            id="businessName"
            type="text"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            placeholder="e.g., Signature Trims Hair Salon"
            required
            className="text-left"
          />
        </div>

        <div className="grid w-full max-w-sm items-center gap-3 text-left">
          <Label className="text-left">{t('businessAddress')}</Label>
          <Input
            id="businessAddress"
            type="text"
            value={businessAddress}
            onChange={e => setBusinessAddress(e.target.value)}
            placeholder="e.g., 123 Main St, Singapore 123456"
            required
            className="text-left"
          />
        </div>

        <div className="grid w-full max-w-sm items-center gap-3 text-left">
          <Label className="text-left">{t('businessPhone')}</Label>
          <Input
            id="businessPhone"
            type="tel"
            value={businessPhone}
            onChange={e => setBusinessPhone(e.target.value)}
            placeholder="e.g., (65) 9876-5432"
            required
            className="text-left"
          />
        </div>

        <div className="p-4 bg-primary/10 border border-primary rounded-lg text-left">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-md text-foreground font-medium mb-1">{t('whereDisplayed')}</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t('displayLocation1')}</li>
                <li>{t('displayLocation2')}</li>
                <li>{t('displayLocation3')}</li>
                <li>{t('displayLocation4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border flex justify-end">
        <LoadingButton
          loading={isSaving}
          loadingText={tSettings('saving')}
          onClick={handleSave}
          className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90"
        >
          {tSettings('saveChanges')}
        </LoadingButton>
      </div>
    </div>
  );
}

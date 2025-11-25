import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import SettingsSidebar, { type SettingsSection } from './SettingsSidebar';
import BusinessSettings from './salon/BusinessSettings';
import ScheduleSettings from './salon/ScheduleSettings';
import ClosuresSettings from './salon/ClosuresSettings';
import { LoadingButton } from '@/components/feedback/loaders/LoadingButton';
import type { AdminSettings } from '@/types';

interface SettingsLayoutProps {
  adminSettings: AdminSettings;
  onSave: (settings: AdminSettings) => Promise<void>;
}

export default function SettingsLayout({ adminSettings, onSave }: SettingsLayoutProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSection>('salon-business');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to ensure complete schedule with all days
  const getCompleteSchedule = (schedule: any) => {
    const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const defaultDay = { isOpen: true, openingTime: '09:00', closingTime: '17:00' };
    const complete: any = {};

    DAYS.forEach(day => {
      complete[day] = schedule?.[day] || defaultDay;
    });

    return complete;
  };

  // Local state for settings - ensure weeklySchedule is complete
  const [businessName, setBusinessName] = useState(adminSettings.businessName || '');
  const [businessAddress, setBusinessAddress] = useState(adminSettings.businessAddress || '');
  const [businessPhone, setBusinessPhone] = useState(adminSettings.businessPhone || '');
  const [weeklySchedule, setWeeklySchedule] = useState(
    getCompleteSchedule(adminSettings.weeklySchedule),
  );
  const [closedDates, setClosedDates] = useState<string[]>(adminSettings.closedDates || []);

  // Sync with prop changes
  useEffect(() => {
    setBusinessName(adminSettings.businessName || '');
    setBusinessAddress(adminSettings.businessAddress || '');
    setBusinessPhone(adminSettings.businessPhone || '');
    setWeeklySchedule(getCompleteSchedule(adminSettings.weeklySchedule));
    setClosedDates(adminSettings.closedDates || []);
  }, [adminSettings]);

  const handleBusinessFieldChange = (
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
      await onSave({
        ...adminSettings,
        businessName,
        businessAddress,
        businessPhone,
        weeklySchedule,
        closedDates,
      });
      toast.success('Settings saved successfully!', { id: toastId });
      // Refresh server components (including footer in layout)
      router.refresh();
    } catch (error) {
      toast.error('Failed to save settings.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-[600px]">
      {/* Sidebar Navigation */}
      <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Content Area */}
      <div className="flex-1 p-[var(--space-6)]">
        <div className="max-w-3xl">
          {/* Render Active Section */}
          {activeSection === 'salon-business' && (
            <BusinessSettings
              businessName={businessName}
              businessAddress={businessAddress}
              businessPhone={businessPhone}
              onChange={handleBusinessFieldChange}
            />
          )}
          {activeSection === 'salon-schedule' && (
            <ScheduleSettings weeklySchedule={weeklySchedule} onChange={setWeeklySchedule} />
          )}
          {activeSection === 'salon-closures' && (
            <ClosuresSettings closedDates={closedDates} onChange={setClosedDates} />
          )}

          {/* Save Button */}
          <div className="mt-[var(--space-8)] pt-[var(--space-6)] border-t border-[var(--gray-6)] flex justify-end">
            <LoadingButton
              loading={isSaving}
              loadingText="Saving..."
              onClick={handleSave}
              className="px-[var(--space-5)] py-[var(--space-3)] bg-accent text-white rounded-[var(--radius-2)] text-[length:var(--font-size-3)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Save Changes
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
}

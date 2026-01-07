'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBooking } from '@/context/BookingContext';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { LoadingButton } from '@/components/feedback/loaders/LoadingButton';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, CalendarClock, XCircle, Scissors, Shield, Link2 } from 'lucide-react';
import BusinessSettings from '@/components/admin/settings/salon/BusinessSettings';
import ScheduleSettings from '@/components/admin/settings/salon/ScheduleSettings';
import ClosuresSettings from '@/components/admin/settings/salon/ClosuresSettings';
import ServicesSettings from '@/components/admin/settings/salon/ServicesSettings';
import DepositSettings from '@/components/admin/settings/salon/DepositSettings';
import SocialLinksSettings from '@/components/admin/settings/salon/SocialLinksSettings';
import type { BlockedPeriod } from '@/types';

type SettingsTab = 'business' | 'schedule' | 'closures' | 'services' | 'deposits' | 'social';

export default function UnifiedSettingsPage() {
  const { adminSettings, fetchAndSetAdminSettings, saveAdminSettings } = useBooking();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get('tab') as SettingsTab) || 'business';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Business settings state
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');

  // Schedule settings state
  const [weeklySchedule, setWeeklySchedule] = useState<any>({});

  // Closures settings state
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
    // Business
    setBusinessName(adminSettings.businessName || '');
    setBusinessAddress(adminSettings.businessAddress || '');
    setBusinessPhone(adminSettings.businessPhone || '');

    // Schedule
    const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const defaultDay = { isOpen: true, openingTime: '09:00', closingTime: '17:00' };
    const schedule: any = {};
    DAYS.forEach(day => {
      schedule[day] =
        adminSettings.weeklySchedule?.[day as keyof typeof adminSettings.weeklySchedule] ||
        defaultDay;
    });
    setWeeklySchedule(schedule);

    // Closures
    setSpecialClosures(adminSettings.specialClosures || []);
  }, [adminSettings]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as SettingsTab);
    // Update URL without navigation for deep-linking
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.replaceState({}, '', url.toString());
  };

  const handleBusinessFieldChange = (
    field: 'businessName' | 'businessAddress' | 'businessPhone',
    value: string,
  ) => {
    if (field === 'businessName') setBusinessName(value);
    else if (field === 'businessAddress') setBusinessAddress(value);
    else if (field === 'businessPhone') setBusinessPhone(value);
  };

  const handleSaveBusinessScheduleClosures = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Saving settings...');
    try {
      await saveAdminSettings({
        ...adminSettings,
        businessName,
        businessAddress,
        businessPhone,
        weeklySchedule,
        specialClosures,
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

  const tabs = [
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'schedule', label: 'Schedule', icon: CalendarClock },
    { id: 'closures', label: 'Closures', icon: XCircle },
    { id: 'services', label: 'Services', icon: Scissors },
    { id: 'deposits', label: 'Deposits', icon: Shield },
    { id: 'social', label: 'Social', icon: Link2 },
  ];

  // Tabs that need external save button (business, schedule, closures)
  const needsSaveButton = ['business', 'schedule', 'closures'].includes(activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your salon&apos;s business information, schedule, and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent p-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 hover:bg-muted transition-colors"
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="bg-white border border-border rounded-lg p-6">
          <TabsContent value="business" className="mt-0 focus:outline-none">
            <BusinessSettings
              businessName={businessName}
              businessAddress={businessAddress}
              businessPhone={businessPhone}
              onChange={handleBusinessFieldChange}
            />
          </TabsContent>

          <TabsContent value="schedule" className="mt-0 focus:outline-none">
            <ScheduleSettings weeklySchedule={weeklySchedule} onChange={setWeeklySchedule} />
          </TabsContent>

          <TabsContent value="closures" className="mt-0 focus:outline-none">
            <ClosuresSettings closures={specialClosures} onChange={setSpecialClosures} />
          </TabsContent>

          <TabsContent value="services" className="mt-0 focus:outline-none">
            <ServicesSettings />
          </TabsContent>

          <TabsContent value="deposits" className="mt-0 focus:outline-none">
            <DepositSettings />
          </TabsContent>

          <TabsContent value="social" className="mt-0 focus:outline-none">
            <SocialLinksSettings />
          </TabsContent>

          {/* Save button for tabs that need it */}
          {needsSaveButton && (
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <LoadingButton
                loading={isSaving}
                loadingText="Saving..."
                onClick={handleSaveBusinessScheduleClosures}
                className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90"
              >
                Save Changes
              </LoadingButton>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}

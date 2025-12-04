'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useBooking } from '@/context/BookingContext';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import AvailabilityModeToggle, {
  type AvailabilityMode,
} from '@/components/admin/availability/AvailabilityModeToggle';
import SalonAvailability from '@/components/admin/availability/SalonAvailability';
import StylistAvailability from '@/components/admin/availability/StylistAvailability';

export default function AvailabilityPage() {
  const { user, isLoading: authLoading } = useAuth();
  const {
    adminSettings,
    appointments,
    getAvailableSlots,
    blockTimeSlot,
    unblockTimeSlot,
    fetchAndSetAdminSettings,
    fetchAndSetAppointments,
  } = useBooking();
  const router = useRouter();

  const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>('salon-wide');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAndSetAdminSettings(), fetchAndSetAppointments()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAndSetAdminSettings, fetchAndSetAppointments]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading availability..." />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <AdminLayout title="Availability">
      <div className="space-y-6">
        <AvailabilityModeToggle mode={availabilityMode} onChange={setAvailabilityMode} />

        {availabilityMode === 'salon-wide' ? (
          <SalonAvailability
            adminSettings={adminSettings}
            appointments={appointments}
            getAvailableSlots={getAvailableSlots}
            blockTimeSlot={blockTimeSlot}
            unblockTimeSlot={unblockTimeSlot}
          />
        ) : (
          <StylistAvailability onNavigateToStylists={() => router.push(`/admin/stylists`)} />
        )}
      </div>
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBooking } from '@/context/BookingContext';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import AvailabilityModeToggle, {
  type AvailabilityMode,
} from '@/components/admin/availability/AvailabilityModeToggle';
import SalonAvailability from '@/components/admin/availability/SalonAvailability';
import StylistAvailability from '@/components/admin/availability/StylistAvailability';

export default function AvailabilityPage() {
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
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAndSetAdminSettings(), fetchAndSetAppointments()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAndSetAdminSettings, fetchAndSetAppointments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" message="Loading availability..." />
      </div>
    );
  }

  return (
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
  );
}

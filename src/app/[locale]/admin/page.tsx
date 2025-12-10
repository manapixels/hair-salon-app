'use client';

import AdminDashboardHome from '@/components/admin/AdminDashboardHome';
import { useBooking } from '@/context/BookingContext';
import { useEffect } from 'react';

export default function AdminPage() {
  const { appointments, fetchAndSetAppointments } = useBooking();

  useEffect(() => {
    fetchAndSetAppointments();
  }, [fetchAndSetAppointments]);

  return <AdminDashboardHome appointments={appointments} flaggedChatCount={0} />;
}

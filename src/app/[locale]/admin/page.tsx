'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboardHome from '@/components/admin/AdminDashboardHome';
import { useBooking } from '@/context/BookingContext';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { useTranslations } from 'next-intl';

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { appointments, fetchAndSetAppointments } = useBooking();
  const router = useRouter();
  const t = useTranslations('Admin.Common');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchAndSetAppointments();
  }, [fetchAndSetAppointments]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <LoadingSpinner size="lg" message={t('verifyingAccess')} />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout
      badges={{
        appointments: getAppointmentsToday(appointments),
      }}
    >
      <AdminDashboardHome appointments={appointments} flaggedChatCount={0} />
    </AdminLayout>
  );
}

function getAppointmentsToday(appointments: any[]): number {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return (appointments || []).filter(
    a => new Date(a.date) >= startOfToday && new Date(a.date) <= endOfToday,
  ).length;
}

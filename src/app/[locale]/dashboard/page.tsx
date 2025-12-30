'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CustomerDashboard from '@/components/views/CustomerDashboard';
import StylistDashboard from '@/components/views/StylistDashboard';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { hasStylistAccess } from '@/lib/roleHelpers';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading your dashboard..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show appropriate dashboard based on user role
  const showStylistDashboard = hasStylistAccess(user);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {showStylistDashboard ? <StylistDashboard /> : <CustomerDashboard />}
      </main>
    </div>
  );
}

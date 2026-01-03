'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import StylistDashboard from '@/components/views/StylistDashboard';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { isStylist } from '@/lib/roleHelpers';

export default function StylistPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/');
      } else if (!isStylist(user)) {
        // Not a stylist? Check other roles or home
        router.push('/customer');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !isStylist(user)) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading stylist dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <StylistDashboard />
      </main>
    </div>
  );
}

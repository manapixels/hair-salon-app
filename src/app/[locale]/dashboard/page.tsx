'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { isStylist, isAdmin } from '@/lib/roleHelpers';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/');
      } else {
        // Redirect logic based on role priority
        // 1. Pure Admin -> /admin
        // 2. Stylist -> /stylist
        // 3. Customer (Default) -> /customer

        if (isAdmin(user) && !isStylist(user)) {
          router.replace('/admin');
        } else if (isStylist(user)) {
          router.replace('/stylist');
        } else {
          router.replace('/customer');
        }
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <LoadingSpinner size="lg" message="Redirecting..." />
    </div>
  );
}

'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminDashboard from '@/components/views/AdminDashboard';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Verifying admin access..." />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans">
      <AppHeader view="admin" onViewChange={() => {}} onLoginClick={() => {}} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <AdminDashboard />
      </main>
      <AppFooter />
    </div>
  );
}

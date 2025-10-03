'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminDashboard from '@/components/AdminDashboard';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
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

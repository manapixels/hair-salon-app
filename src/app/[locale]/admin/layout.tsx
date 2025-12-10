'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { useTranslations } from 'next-intl';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('Admin.Common');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <LoadingSpinner size="lg" message={t('verifyingAccess')} />
      </div>
    );
  }

  // Redirect if not admin (useEffect handles redirect, this prevents flash)
  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  // Render persistent AdminLayout with child page content
  return <AdminLayout>{children}</AdminLayout>;
}

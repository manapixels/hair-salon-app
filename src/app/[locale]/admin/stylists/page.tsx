'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StylistManagement from '@/components/team/StylistManagement';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { useTranslations } from 'next-intl';

export default function StylistsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('Admin.Stylists');
  const tCommon = useTranslations('Admin.Common');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <LoadingSpinner size="lg" message={tCommon('loading')} />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <AdminLayout title={t('title')}>
      <StylistManagement onClose={() => {}} />
    </AdminLayout>
  );
}

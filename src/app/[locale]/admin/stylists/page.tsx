'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StylistManagement from '@/components/team/StylistManagement';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { useTranslations } from 'next-intl';
import { Plus } from '@/lib/icons';

export default function StylistsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('Admin.Stylists');
  const tCommon = useTranslations('Admin.Common');
  const [showAddModal, setShowAddModal] = useState(false);

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
    <AdminLayout
      title={t('title')}
      headerAction={
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center text-sm"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          <span>{t('addStylist')}</span>
        </button>
      }
    >
      <StylistManagement
        onClose={() => {}}
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
      />
    </AdminLayout>
  );
}

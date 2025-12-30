'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import KnowledgeBaseManager from '@/components/admin/KnowledgeBaseManager';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { isAdmin } from '@/lib/roleHelpers';

export default function KnowledgeBasePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin(user))) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  if (!user || !isAdmin(user)) return null;

  return (
    <AdminLayout title="Knowledge Base">
      <KnowledgeBaseManager />
    </AdminLayout>
  );
}

'use client';

import StylistDashboard from '@/components/views/StylistDashboard';
import { useAuth } from '@/context/AuthContext';
import { isStylist } from '@/lib/roleHelpers';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminStylistProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if user is not a stylist
  useEffect(() => {
    if (!isLoading && user && !isStylist(user)) {
      router.push('/admin');
    }
  }, [user, isLoading, router]);

  // If not a stylist, don't render
  if (!user || !isStylist(user)) {
    return null;
  }

  return <StylistDashboard />;
}

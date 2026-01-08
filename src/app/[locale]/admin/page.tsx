import type { Metadata } from 'next';
import { getAppointments } from '@/lib/database';
import AdminDashboard from './_components/AdminDashboard';
import { adminPageMetadata } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'dashboard');
}

export default async function AdminPage() {
  // Fetch appointments directly on the server
  const appointments = await getAppointments();

  return <AdminDashboard appointments={appointments} flaggedChatCount={0} />;
}

import { getAppointments } from '@/lib/database';
import AdminDashboardHome from '@/components/admin/AdminDashboardHome';

export default async function AdminPage() {
  // Fetch appointments directly on the server
  const appointments = await getAppointments();

  return <AdminDashboardHome appointments={appointments} flaggedChatCount={0} />;
}

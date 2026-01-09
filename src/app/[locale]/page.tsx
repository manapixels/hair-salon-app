import { getAdminSettings } from '@/lib/database';
import HomeClient from './_components/HomeClient';

/**
 * Homepage - Server Component
 * Fetches admin settings server-side for faster initial load
 */
export default async function HomePage() {
  const adminSettings = await getAdminSettings();

  return <HomeClient adminSettings={adminSettings} />;
}

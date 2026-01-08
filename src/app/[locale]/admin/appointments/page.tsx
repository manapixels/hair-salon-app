import type { Metadata } from 'next';
import { adminPageMetadata } from '@/lib/metadata';
import AppointmentsList from './_components/AppointmentsList';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return adminPageMetadata(locale, 'appointments');
}

export default function AppointmentsPage() {
  return <AppointmentsList />;
}

import { redirect } from 'next/navigation';

export default function AvailabilityPage({ params }: { params: { locale: string } }) {
  // Redirect to the default availability tab
  redirect(`/${params.locale}/admin/availability/stylists`);
}

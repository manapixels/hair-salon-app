import { redirect } from 'next/navigation';

export default function SettingsPage({ params }: { params: { locale: string } }) {
  // Redirect to the default settings tab
  redirect(`/${params.locale}/admin/settings/business`);
}

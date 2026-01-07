import SettingsTabNav from '@/components/admin/settings/SettingsTabNav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SettingsTabNav />
      <div className="bg-white border border-border rounded-lg p-6">{children}</div>
    </div>
  );
}

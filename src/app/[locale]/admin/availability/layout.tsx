import AvailabilityTabNav from '@/components/admin/availability/AvailabilityTabNav';

export default function AvailabilityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <AvailabilityTabNav />
      <div className="bg-white border border-border rounded-lg p-6">{children}</div>
    </div>
  );
}

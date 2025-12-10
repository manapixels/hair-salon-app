import { Building2, User } from 'lucide-react';

export type AvailabilityMode = 'salon-wide' | 'per-stylist';

interface AvailabilityModeToggleProps {
  mode: AvailabilityMode;
  onChange: (mode: AvailabilityMode) => void;
}

export default function AvailabilityModeToggle({ mode, onChange }: AvailabilityModeToggleProps) {
  return (
    <div className="bg-muted/50 border border-border rounded-xl p-1.5 inline-flex gap-1 shadow-sm">
      <button
        onClick={() => onChange('salon-wide')}
        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
          mode === 'salon-wide'
            ? 'bg-white text-primary shadow-md ring-1 ring-border'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <Building2 className="w-4 h-4" />
        <span>Salon-Wide</span>
      </button>
      <button
        onClick={() => onChange('per-stylist')}
        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
          mode === 'per-stylist'
            ? 'bg-white text-primary shadow-md ring-1 ring-border'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <User className="w-4 h-4" />
        <span>Per-Stylist</span>
      </button>
    </div>
  );
}

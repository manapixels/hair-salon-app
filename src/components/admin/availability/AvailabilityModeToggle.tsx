export type AvailabilityMode = 'salon-wide' | 'per-stylist';

interface AvailabilityModeToggleProps {
  mode: AvailabilityMode;
  onChange: (mode: AvailabilityMode) => void;
}

export default function AvailabilityModeToggle({ mode, onChange }: AvailabilityModeToggleProps) {
  return (
    <div className="bg-[var(--gray-2)] border border-[var(--gray-6)] rounded-[var(--radius-3)] p-[var(--space-1)] inline-flex">
      <button
        onClick={() => onChange('salon-wide')}
        className={`px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-2)] text-[length:var(--font-size-2)] font-medium transition-all ${
          mode === 'salon-wide'
            ? 'bg-[var(--color-surface)] text-[var(--accent-11)] shadow-sm border border-[var(--gray-6)]'
            : 'text-[var(--gray-11)] hover:text-[var(--gray-12)]'
        }`}
      >
        <div className="flex items-center space-x-[var(--space-2)]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span>Salon-Wide</span>
        </div>
      </button>
      <button
        onClick={() => onChange('per-stylist')}
        className={`px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-2)] text-[length:var(--font-size-2)] font-medium transition-all ${
          mode === 'per-stylist'
            ? 'bg-[var(--color-surface)] text-[var(--accent-11)] shadow-sm border border-[var(--gray-6)]'
            : 'text-[var(--gray-11)] hover:text-[var(--gray-12)]'
        }`}
      >
        <div className="flex items-center space-x-[var(--space-2)]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>Per-Stylist</span>
        </div>
      </button>
    </div>
  );
}

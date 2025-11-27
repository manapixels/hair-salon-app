'use client';

import * as React from 'react';
import { Check } from 'lucide-react';

interface FilterPillProps {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FilterPill({
  label,
  icon,
  active = false,
  onClick,
  className = '',
}: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full
        font-medium text-sm transition-all duration-200
        border-2 whitespace-nowrap
        focus:outline-none focus:ring-2 focus:ring-[var(--accent-8)] focus:ring-offset-2
        ${
          active
            ? 'bg-[var(--accent-9)] text-white border-[var(--accent-9)] shadow-md shadow-[var(--accent-4)]'
            : 'bg-white text-[var(--gray-11)] border-[var(--gray-6)] hover:border-[var(--accent-8)] hover:text-[var(--accent-11)]'
        }
        ${className}
      `}
      aria-pressed={active}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
      {active && <Check className="w-4 h-4 flex-shrink-0" />}
    </button>
  );
}

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
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${
          active
            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
            : 'bg-white text-muted-foreground border-border hover:border-primary hover:text-primary'
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

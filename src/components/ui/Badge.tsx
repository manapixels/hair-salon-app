'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Badge variant
   * - default: Neutral gray
   * - accent: Primary accent color
   * - success: Green for confirmed/success
   * - warning: Orange for pending/warning
   * - danger: Red for cancelled/error
   * - info: Blue for informational
   */
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

  /**
   * Badge size
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Optional dot indicator
   */
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', dot = false, className, children, ...props }, ref) => {
    const baseStyles = cn(
      'inline-flex items-center gap-[var(--space-1)]',
      'font-medium',
      'whitespace-nowrap',
      'rounded-full',
      'transition-colors',
    );

    const variantStyles = {
      default: 'bg-[var(--gray-3)] text-[var(--gray-11)] border border-[var(--gray-6)]',
      accent: 'bg-[var(--accent-3)] text-[var(--accent-11)] border border-[var(--accent-6)]',
      success: 'bg-[var(--green-3)] text-[var(--green-11)] border border-[var(--green-6)]',
      warning: 'bg-[var(--orange-3)] text-[var(--orange-11)] border border-[var(--orange-6)]',
      danger: 'bg-[var(--red-3)] text-[var(--red-11)] border border-[var(--red-6)]',
      info: 'bg-[var(--blue-3)] text-[var(--blue-11)] border border-[var(--blue-6)]',
    };

    const sizeStyles = {
      sm: 'px-[var(--space-2)] py-[var(--space-1)] text-[length:var(--font-size-1)]',
      md: 'px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--font-size-2)]',
      lg: 'px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--font-size-3)]',
    };

    const dotColors = {
      default: 'bg-[var(--gray-9)]',
      accent: 'bg-[var(--accent-9)]',
      success: 'bg-[var(--green-9)]',
      warning: 'bg-[var(--orange-9)]',
      danger: 'bg-[var(--red-9)]',
      info: 'bg-[var(--blue-9)]',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {dot && (
          <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} aria-hidden="true" />
        )}
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant
   */
  variant?: 'solid' | 'soft' | 'outline' | 'ghost' | 'danger';

  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Icon element (Lucide or Radix icon)
   */
  icon: ReactNode;

  /**
   * Accessible label (required for icon-only buttons)
   */
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { variant = 'ghost', size = 'md', loading = false, icon, className, disabled, ...props },
    ref,
  ) => {
    const baseStyles = cn(
      // Layout
      'inline-flex items-center justify-center',
      'rounded-full',
      'font-medium',
      'transition-all duration-200',
      'cursor-pointer',

      // Focus states
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',

      // Disabled states
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    );

    const variantStyles = {
      solid: cn(
        'bg-[var(--accent-9)] text-white',
        'hover:bg-[var(--accent-10)]',
        'active:bg-[var(--accent-11)]',
        'focus-visible:ring-[var(--accent-8)]',
        'shadow-sm hover:shadow-md',
      ),
      soft: cn(
        'bg-[var(--accent-3)] text-[var(--accent-11)]',
        'hover:bg-[var(--accent-4)]',
        'active:bg-[var(--accent-5)]',
        'focus-visible:ring-[var(--accent-8)]',
      ),
      outline: cn(
        'border border-[var(--gray-7)] text-[var(--gray-12)]',
        'hover:bg-[var(--gray-2)] hover:border-[var(--gray-8)]',
        'active:bg-[var(--gray-3)]',
        'focus-visible:ring-[var(--accent-8)]',
      ),
      ghost: cn(
        'text-[var(--gray-11)] hover:text-[var(--gray-12)]',
        'hover:bg-[var(--gray-3)]',
        'active:bg-[var(--gray-4)]',
        'focus-visible:ring-[var(--accent-8)]',
      ),
      danger: cn(
        'bg-[var(--red-9)] text-white',
        'hover:bg-[var(--red-10)]',
        'active:bg-[var(--red-11)]',
        'focus-visible:ring-[var(--red-8)]',
        'shadow-sm hover:shadow-md',
      ),
    };

    const sizeStyles = {
      sm: 'w-8 h-8 [&>svg]:w-3.5 [&>svg]:h-3.5',
      md: 'w-10 h-10 [&>svg]:w-4 [&>svg]:h-4',
      lg: 'w-12 h-12 [&>svg]:w-5 [&>svg]:h-5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : icon}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';

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
        'bg-accent text-white',
        'hover:bg-accent hover:bg-accent/90',
        'active:bg-accent-foreground',
        'focus-visible:ring-accent',
        'shadow-sm hover:shadow-md',
      ),
      soft: cn(
        'bg-accent/10 text-accent-foreground',
        'hover:bg-accent/20',
        'active:bg-accent/30',
        'focus-visible:ring-accent',
      ),
      outline: cn(
        'border border-gray-300 dark:border-gray-600 text-foreground',
        'hover:bg-muted hover:border-gray-400 dark:hover:border-gray-500',
        'active:bg-gray-100 dark:bg-gray-800',
        'focus-visible:ring-accent',
      ),
      ghost: cn(
        'text-muted-foreground hover:text-foreground',
        'hover:bg-gray-100 dark:bg-gray-800',
        'active:bg-gray-200 dark:bg-gray-700',
        'focus-visible:ring-accent',
      ),
      danger: cn(
        'bg-destructive text-white',
        'hover:bg-destructive/90',
        'active:bg-destructive',
        'focus-visible:ring-destructive',
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

'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant
   * - solid: Primary action (accent background)
   * - soft: Secondary action (soft accent background)
   * - outline: Tertiary action (border only)
   * - ghost: Minimal action (no background)
   * - danger: Destructive action (red theme)
   */
  variant?: 'solid' | 'soft' | 'outline' | 'ghost' | 'danger';

  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Loading state - shows spinner and disables button
   */
  loading?: boolean;

  /**
   * Optional text to show during loading
   */
  loadingText?: string;

  /**
   * Full width button
   */
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'solid',
      size = 'md',
      loading = false,
      loadingText,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles = cn(
      // Layout
      'inline-flex items-center justify-center gap-[var(--space-2)]',
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
        'text-[var(--gray-12)]',
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
      sm: cn(
        'px-[var(--space-3)] py-[var(--space-1)]',
        'text-[length:var(--font-size-1)]',
        'rounded-[var(--radius-2)]',
      ),
      md: cn(
        'px-[var(--space-4)] py-[var(--space-2)]',
        'text-[length:var(--font-size-2)]',
        'rounded-[var(--radius-2)]',
      ),
      lg: cn(
        'px-[var(--space-5)] py-[var(--space-3)]',
        'text-[length:var(--font-size-3)]',
        'rounded-[var(--radius-3)]',
      ),
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className,
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Card variant
   * - default: Standard card
   * - interactive: Clickable card with hover effects
   * - outline: Subtle outline card
   */
  variant?: 'default' | 'interactive' | 'outline';

  /**
   * Selected state for interactive cards
   */
  selected?: boolean;

  /**
   * Disabled state for interactive cards
   */
  disabled?: boolean;

  /**
   * Show checkmark indicator when selected
   */
  showCheckmark?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      selected = false,
      disabled = false,
      showCheckmark = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles = cn(
      // Layout
      'relative',
      'rounded-[var(--radius-3)]',
      'p-[var(--space-4)]',
      'transition-all duration-200',
    );

    const variantStyles = {
      default: cn('bg-[var(--color-panel)]', 'border border-[var(--gray-6)]', 'shadow-sm'),
      interactive: cn(
        'bg-[var(--color-panel)]',
        'border border-[var(--gray-6)]',
        'cursor-pointer',
        'hover:border-[var(--gray-8)] hover:shadow-md',
        'active:scale-[0.98]',
        selected && [
          'border-[var(--accent-9)] border-2',
          'bg-[var(--accent-2)]',
          'shadow-lg ring-2 ring-[var(--accent-9)] ring-opacity-20',
        ],
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
      ),
      outline: cn(
        'bg-transparent',
        'border border-[var(--gray-5)]',
        'hover:border-[var(--gray-7)]',
      ),
    };

    return (
      <div ref={ref} className={cn(baseStyles, variantStyles[variant], className)} {...props}>
        {/* Selected checkmark indicator */}
        {showCheckmark && selected && (
          <div
            className={cn(
              'absolute top-[var(--space-3)] right-[var(--space-3)]',
              'flex items-center justify-center',
              'w-6 h-6',
              'rounded-full',
              'bg-[var(--accent-9)]',
              'text-white',
              'shadow-md',
            )}
            aria-hidden="true"
          >
            <Check className="h-4 w-4" />
          </div>
        )}
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

/**
 * Card Header - For card titles and optional actions
 */
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between gap-[var(--space-2)] mb-[var(--space-3)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
CardHeader.displayName = 'CardHeader';

/**
 * Card Title
 */
export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-[length:var(--font-size-4)] font-semibold text-[var(--gray-12)]',
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  ),
);
CardTitle.displayName = 'CardTitle';

/**
 * Card Description
 */
export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-[length:var(--font-size-2)] text-[var(--gray-11)]', className)}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = 'CardDescription';

/**
 * Card Content - Main content area
 */
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-[var(--space-2)]', className)} {...props}>
      {children}
    </div>
  ),
);
CardContent.displayName = 'CardContent';

/**
 * Card Footer - For actions or additional info
 */
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-[var(--space-2)] mt-[var(--space-4)] pt-[var(--space-4)] border-t border-[var(--gray-6)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
CardFooter.displayName = 'CardFooter';

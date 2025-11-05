'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="flex flex-col gap-[var(--space-1)]">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[length:var(--font-size-2)] font-medium text-[var(--gray-12)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-[var(--space-3)] py-[var(--space-2)]',
            'rounded-[var(--radius-2)]',
            'border border-[var(--gray-7)]',
            'bg-[var(--color-surface)]',
            'text-[length:var(--font-size-2)] text-[var(--gray-12)]',
            'placeholder:text-[var(--gray-9)]',
            'transition-colors',
            'hover:border-[var(--gray-8)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] focus-visible:border-[var(--accent-8)]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--gray-2)]',
            'resize-vertical min-h-[100px]',
            error && 'border-[var(--red-8)] focus-visible:ring-[var(--red-8)]',
            className,
          )}
          {...props}
        />
        {error && (
          <span className="text-[length:var(--font-size-1)] text-[var(--red-11)]" role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span className="text-[length:var(--font-size-1)] text-[var(--gray-11)]">
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';

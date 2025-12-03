'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="flex flex-col gap-0.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2',
            'rounded-md',
            'border border-gray-300 dark:border-gray-600',
            'bg-background',
            'text-sm text-foreground',
            'placeholder:text-gray-400',
            'transition-colors',
            'hover:border-gray-400 dark:hover:border-gray-500',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted',
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-destructive" role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span className="text-xs text-muted-foreground">{helperText}</span>
        )}
      </div>
    );
  },
);

TextField.displayName = 'TextField';

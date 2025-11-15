'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Base FormField wrapper for consistent form styling
 */
interface FormFieldWrapperProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  id?: string;
  children: ReactNode;
}

export const FormFieldWrapper = ({
  label,
  error,
  helperText,
  required,
  id,
  children,
}: FormFieldWrapperProps) => {
  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      {label && (
        <label
          htmlFor={id}
          className="text-[length:var(--font-size-2)] font-medium text-[var(--gray-12)]"
        >
          {label}
          {required && (
            <span className="text-[var(--red-9)] ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error && (
        <span className="text-[length:var(--font-size-1)] text-[var(--red-11)]" role="alert">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span className="text-[length:var(--font-size-1)] text-[var(--gray-11)]">{helperText}</span>
      )}
    </div>
  );
};

/**
 * Input component with Radix CSS variables
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, required, ...props }, ref) => {
    const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <FormFieldWrapper
        label={label}
        error={error}
        helperText={helperText}
        required={required}
        id={inputId}
      >
        <input
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
            error && 'border-[var(--red-8)] focus-visible:ring-[var(--red-8)]',
            className,
          )}
          aria-required={required}
          aria-invalid={!!error}
          {...props}
        />
      </FormFieldWrapper>
    );
  },
);

Input.displayName = 'Input';

/**
 * Textarea component with Radix CSS variables
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, required, ...props }, ref) => {
    const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <FormFieldWrapper
        label={label}
        error={error}
        helperText={helperText}
        required={required}
        id={inputId}
      >
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
          aria-required={required}
          aria-invalid={!!error}
          {...props}
        />
      </FormFieldWrapper>
    );
  },
);

Textarea.displayName = 'Textarea';

/**
 * Select component with Radix CSS variables
 */
export interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className, id, required, ...props }, ref) => {
    const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <FormFieldWrapper
        label={label}
        error={error}
        helperText={helperText}
        required={required}
        id={inputId}
      >
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-[var(--space-3)] py-[var(--space-2)]',
            'rounded-[var(--radius-2)]',
            'border border-[var(--gray-7)]',
            'bg-[var(--color-surface)]',
            'text-[length:var(--font-size-2)] text-[var(--gray-12)]',
            'transition-colors',
            'hover:border-[var(--gray-8)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] focus-visible:border-[var(--accent-8)]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--gray-2)]',
            error && 'border-[var(--red-8)] focus-visible:ring-[var(--red-8)]',
            className,
          )}
          aria-required={required}
          aria-invalid={!!error}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </FormFieldWrapper>
    );
  },
);

Select.displayName = 'Select';

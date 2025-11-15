'use client';

import { forwardRef, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  /**
   * Controls the open state
   */
  open: boolean;

  /**
   * Callback when open state changes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Modal content
   */
  children: ReactNode;

  /**
   * Modal size
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * Modal - Wrapper for Radix Dialog with standardized styling
 */
export const Modal = ({ open, onOpenChange, children, size = 'md' }: ModalProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );
};

/**
 * ModalTrigger - Button that opens the modal
 */
export const ModalTrigger = Dialog.Trigger;

/**
 * ModalContent - The modal content container
 */
export const ModalContent = forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showClose?: boolean;
  }
>(({ size = 'md', showClose = true, className, children, ...props }, ref) => {
  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[90vw]',
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          'fixed inset-0 z-50',
          'bg-black/50 backdrop-blur-sm',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        )}
      />
      <Dialog.Content
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-50',
          'translate-x-[-50%] translate-y-[-50%]',
          'w-full',
          sizeStyles[size],
          'max-h-[85vh] overflow-y-auto',
          'rounded-[var(--radius-4)]',
          'bg-[var(--color-panel)]',
          'border border-[var(--gray-6)]',
          'shadow-xl',
          'p-[var(--space-6)]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          'duration-200',
          className,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <Dialog.Close
            className={cn(
              'absolute right-[var(--space-4)] top-[var(--space-4)]',
              'rounded-full p-[var(--space-2)]',
              'text-[var(--gray-11)] hover:text-[var(--gray-12)]',
              'hover:bg-[var(--gray-4)]',
              'transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]',
            )}
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
});
ModalContent.displayName = 'ModalContent';

/**
 * ModalHeader - Header section of the modal
 */
export const ModalHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-[var(--space-2)] mb-[var(--space-5)]', className)}
      {...props}
    >
      {children}
    </div>
  ),
);
ModalHeader.displayName = 'ModalHeader';

/**
 * ModalTitle
 */
export const ModalTitle = forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, children, ...props }, ref) => (
  <Dialog.Title
    ref={ref}
    className={cn(
      'text-[length:var(--font-size-6)] font-semibold text-[var(--gray-12)]',
      className,
    )}
    {...props}
  >
    {children}
  </Dialog.Title>
));
ModalTitle.displayName = 'ModalTitle';

/**
 * ModalDescription
 */
export const ModalDescription = forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(({ className, children, ...props }, ref) => (
  <Dialog.Description
    ref={ref}
    className={cn('text-[length:var(--font-size-2)] text-[var(--gray-11)]', className)}
    {...props}
  >
    {children}
  </Dialog.Description>
));
ModalDescription.displayName = 'ModalDescription';

/**
 * ModalBody - Main content area of the modal
 */
export const ModalBody = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-[var(--space-4)]', className)} {...props}>
      {children}
    </div>
  ),
);
ModalBody.displayName = 'ModalBody';

/**
 * ModalFooter - Footer section for actions
 */
export const ModalFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-[var(--space-3)] mt-[var(--space-6)] pt-[var(--space-5)] border-t border-[var(--gray-6)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
ModalFooter.displayName = 'ModalFooter';

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
          'rounded-xl',
          'bg-card',
          'border border-border',
          'shadow-xl',
          'p-6',
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
              'absolute right-[4] top-4',
              'rounded-full p-[2]',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-gray-200 dark:bg-gray-700',
              'transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
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
    <div ref={ref} className={cn('flex flex-col gap-[2] mb-[5]', className)} {...props}>
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
    className={cn('text-xl font-semibold text-foreground', className)}
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
    className={cn('text-sm text-muted-foreground', className)}
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
    <div ref={ref} className={cn('space-y-[4]', className)} {...props}>
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
        'flex items-center justify-end gap-[3] mt-6 pt-[5] border-t border-border',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
ModalFooter.displayName = 'ModalFooter';

'use client';

import { Dialog } from '@radix-ui/themes';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ReactNode } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  className?: string;
  headerExtra?: ReactNode;
}

/**
 * Responsive modal component that displays as a bottom sheet on mobile
 * and a centered dialog on desktop
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  description,
  showCloseButton = true,
  headerExtra,
  className = '',
}: BottomSheetProps) {
  const isMobile = useIsMobile();

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Dialog.Content
        className={`
          ${
            isMobile
              ? 'fixed inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl animate-in slide-in-from-bottom duration-300'
              : 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-full rounded-xl'
          }
          bg-white shadow-2xl overflow-y-auto
          ${className}
        `}
        style={{
          maxWidth: isMobile ? '100%' : undefined,
        }}
      >
        {/* Drag handle for mobile */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white z-10">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-20">
            <div>
              {title && <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>}
              {description && (
                <Dialog.Description className="text-sm text-gray-600 mt-1">
                  {description}
                </Dialog.Description>
              )}
              {headerExtra && <div className="mt-4">{headerExtra}</div>}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Safe area padding for iOS home indicator */}
        {isMobile && <div className="h-safe-bottom" />}
      </Dialog.Content>
    </Dialog.Root>
  );
}

/**
 * Simplified bottom sheet for quick use cases
 */
export function SimpleBottomSheet({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      {children}
    </BottomSheet>
  );
}

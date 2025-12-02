'use client';

import { useEffect, useRef, useState } from 'react';
import { useBookingModal } from '@/context/BookingModalContext';
import BookingForm from './BookingForm';
import { BookingProgress } from './BookingProgress';
import { useIsMobile } from '@/hooks/useMediaQuery';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { X } from 'lucide-react';

/**
 * Global booking modal that can be triggered from anywhere in the app
 * Uses Drawer for mobile and Dialog for desktop responsive behavior
 */
export function BookingModal() {
  const { isOpen, preSelectedServiceId, closeModal } = useBookingModal();
  const bookingFormRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const isMobile = useIsMobile();

  // Auto-close modal on successful booking
  useEffect(() => {
    if (!isOpen || !bookingFormRef.current) return;

    // Reset step when modal opens/closes
    if (isOpen) {
      // Optional: reset step if needed, but BookingForm handles internal reset
    } else {
      // Small delay to prevent flickering when reopening
      setTimeout(() => setCurrentStep(1), 300);
    }

    // Monitor for booking confirmation success state
    const checkForSuccess = () => {
      const successHeading = bookingFormRef.current?.querySelector('h2');
      if (successHeading?.textContent?.includes('Booking Confirmed')) {
        // Auto-close after showing success message
        setTimeout(() => {
          closeModal();
        }, 3000);
      }
    };

    // Poll for success state (since BookingForm doesn't expose a callback)
    const interval = setInterval(checkForSuccess, 500);

    return () => clearInterval(interval);
  }, [isOpen, closeModal]);

  const content = (
    <div ref={bookingFormRef} className="max-h-[95vh] overflow-y-auto">
      <BookingForm
        preSelectedServiceId={preSelectedServiceId}
        disableAutoScroll={true}
        onStepChange={setCurrentStep}
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={open => !open && closeModal()}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader>
            <DrawerTitle>Book Your Appointment</DrawerTitle>
            <DrawerDescription>Select your services, stylist, and preferred time</DrawerDescription>
            <div className="mt-4">
              <BookingProgress currentStep={currentStep} />
            </div>
          </DrawerHeader>
          <div className="px-4">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && closeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[95vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-white shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold">Book Your Appointment</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-600">
                Select your services, stylist, and preferred time
              </Dialog.Description>
              <div className="mt-4">
                <BookingProgress currentStep={currentStep} />
              </div>
            </div>
            <Dialog.Close className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          {content}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useBookingModal } from '@/context/BookingModalContext';
import BookingForm from './BookingForm';
import { BookingProgress } from './BookingProgress';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';

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
    <Dialog open={isOpen} onOpenChange={open => !open && closeModal()}>
      <DialogContent className="max-h-[95vh] w-full max-w-3xl overflow-y-auto p-0 gap-0">
        <DialogHeader className="border-b p-6 text-left">
          <DialogTitle className="text-lg font-semibold">Book Your Appointment</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-gray-600">
            Select your services, stylist, and preferred time
          </DialogDescription>
          <div className="mt-4">
            <BookingProgress currentStep={currentStep} />
          </div>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

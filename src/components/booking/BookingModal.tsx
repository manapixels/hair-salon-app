'use client';

import { useEffect, useRef, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useBookingModal } from '@/context/BookingModalContext';
import BookingForm from './BookingForm';
import { BookingProgress } from './BookingProgress';

/**
 * Global booking modal that can be triggered from anywhere in the app
 * Uses BottomSheet for responsive behavior (full-screen on mobile, centered on desktop)
 */
export function BookingModal() {
  const { isOpen, preSelectedServiceId, closeModal } = useBookingModal();
  const bookingFormRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(1);

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

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={closeModal}
      title="Book Your Appointment"
      description="Select your services, stylist, and preferred time"
      className="max-h-[95vh] p-0"
      headerExtra={<BookingProgress currentStep={currentStep} />}
    >
      <div ref={bookingFormRef}>
        <BookingForm
          preSelectedServiceId={preSelectedServiceId}
          disableAutoScroll={true}
          onStepChange={setCurrentStep}
        />
      </div>
    </BottomSheet>
  );
}

'use client';

import { useEffect } from 'react';
import BookingForm from './BookingForm';

interface ServiceBookingWrapperProps {
  preSelectedServiceId?: string;
  serviceName?: string;
}

/**
 * Wrapper component for BookingForm that handles pre-selection of a specific service
 * Used on service detail pages to allow inline booking with the service pre-selected
 */
export default function ServiceBookingWrapper({
  preSelectedServiceId,
  serviceName,
}: ServiceBookingWrapperProps) {
  return (
    <div className="bg-gradient-to-b from-stone-50 to-white py-16 -mx-6 px-6 md:-mx-12 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="uppercase tracking-[0.2em] text-xs font-sans text-stone-500 mb-3">
            Ready to Transform Your Hair?
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-light text-stone-900 mb-4">
            Book Your {serviceName || 'Appointment'}
          </h2>
          <p className="text-stone-600 text-lg max-w-2xl mx-auto">
            {preSelectedServiceId
              ? `Your ${serviceName} service is pre-selected. Choose your preferred stylist, date, and time to complete your booking.`
              : 'Select your desired services and find the perfect time for your appointment.'}
          </p>
        </div>

        <BookingForm preSelectedServiceId={preSelectedServiceId} disableAutoScroll={true} />
      </div>
    </div>
  );
}

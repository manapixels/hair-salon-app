'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingModal } from '@/context/BookingModalContext';

/**
 * /booking opens the booking modal and redirects to homepage
 */
export default function BookingPage() {
  const router = useRouter();
  const { openModal } = useBookingModal();

  useEffect(() => {
    openModal();
    router.replace('/');
  }, [openModal, router]);

  return null;
}

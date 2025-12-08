'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/lib/icons';
import { useBookingModal } from '@/context/BookingModalContext';

interface BookCategoryButtonProps {
  categorySlug?: string;
  className?: string;
  label?: string;
}

export function BookCategoryButton({
  categorySlug,
  className,
  label = 'Book Now',
}: BookCategoryButtonProps) {
  const { openModal } = useBookingModal();

  return (
    <Button
      size="lg"
      className={className}
      onClick={() =>
        openModal(categorySlug ? { preSelectedCategorySlug: categorySlug } : undefined)
      }
    >
      <Calendar className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}

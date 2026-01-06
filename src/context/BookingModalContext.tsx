'use client';

import { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { ServiceCategory } from '@/types';

interface BookingModalOptions {
  preSelectedCategorySlug?: string;
  preSelectedCategoryId?: string;
}

interface BookingModalContextType {
  isOpen: boolean;
  preSelectedCategorySlug?: string;
  preSelectedCategoryId?: string;
  bookingCategories: ServiceCategory[];
  openModal: (options?: BookingModalOptions) => void;
  closeModal: () => void;
}

const BookingModalContext = createContext<BookingModalContextType | undefined>(undefined);

interface BookingModalProviderProps {
  children: ReactNode;
  bookingCategories: ServiceCategory[];
}

export const BookingModalProvider: React.FC<BookingModalProviderProps> = ({
  children,
  bookingCategories,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preSelectedCategorySlug, setPreSelectedCategorySlug] = useState<string | undefined>(
    undefined,
  );
  const [preSelectedCategoryId, setPreSelectedCategoryId] = useState<string | undefined>(undefined);
  const pathname = usePathname();

  const openModal = useCallback((options?: BookingModalOptions) => {
    setIsOpen(true);
    console.log(options);
    setPreSelectedCategorySlug(options?.preSelectedCategorySlug);
    setPreSelectedCategoryId(options?.preSelectedCategoryId);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Reset pre-selected service after modal closes
    setTimeout(() => {
      setPreSelectedCategorySlug(undefined);
      setPreSelectedCategoryId(undefined);
    }, 300); // Delay to allow for exit animation
  }, []);

  // Close modal when route changes
  useEffect(() => {
    if (isOpen) {
      closeModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const value = {
    isOpen,
    preSelectedCategorySlug,
    preSelectedCategoryId,
    bookingCategories,
    openModal,
    closeModal,
  };

  return <BookingModalContext.Provider value={value}>{children}</BookingModalContext.Provider>;
};

export const useBookingModal = (): BookingModalContextType => {
  const context = useContext(BookingModalContext);
  if (context === undefined) {
    throw new Error('useBookingModal must be used within a BookingModalProvider');
  }
  return context;
};

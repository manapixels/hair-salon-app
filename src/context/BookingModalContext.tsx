'use client';

import { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface BookingModalOptions {
  preSelectedServiceId?: string;
}

interface BookingModalContextType {
  isOpen: boolean;
  preSelectedServiceId?: string;
  openModal: (options?: BookingModalOptions) => void;
  closeModal: () => void;
}

const BookingModalContext = createContext<BookingModalContextType | undefined>(undefined);

export const BookingModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<string | undefined>(undefined);
  const pathname = usePathname();

  const openModal = useCallback((options?: BookingModalOptions) => {
    setIsOpen(true);
    setPreSelectedServiceId(options?.preSelectedServiceId);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Reset pre-selected service after modal closes
    setTimeout(() => {
      setPreSelectedServiceId(undefined);
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
    preSelectedServiceId,
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

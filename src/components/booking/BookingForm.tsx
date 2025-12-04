'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

import type { Service, TimeSlot, Appointment, Stylist } from '@/types';
import type { ServiceCategory } from '@/lib/categories';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/context/AuthContext';
import { useBookingModal } from '@/context/BookingModalContext';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import {
  calculateEndTime,
  formatDuration,
  getDurationColor,
  getDurationPercentage,
  formatDisplayDate,
  formatTimeDisplay,
} from '@/lib/timeUtils';
import { LoadingSpinner } from '../feedback/loaders/LoadingSpinner';
import { StylistCardSkeleton } from '../feedback/loaders/StylistCardSkeleton';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import { Check } from '@/lib/icons';
import { MobileBookingSummary } from './MobileBookingSummary';
import { BookingConfirmationSummary } from './BookingConfirmationSummary';
import { SimpleCategorySelector } from './SimpleCategorySelector';
import { useRef } from 'react';
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Code-split heavy components for better performance
const StylistSelectorLoading = () => {
  const t = useTranslations('BookingForm');
  return (
    <div className="scroll-mt-24">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">{t('step2')}</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <LoadingSpinner size="sm" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('loadingStylists')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StylistCardSkeleton count={3} />
        </div>
      </div>
    </div>
  );
};

const StylistSelector = dynamic(
  () => import('./StylistSelector').then(mod => ({ default: mod.StylistSelector })),
  {
    loading: StylistSelectorLoading,
    ssr: false,
  },
);

const DateTimePickerLoading = () => {
  const t = useTranslations('BookingForm');
  return (
    <div>
      <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-200">{t('step3')}</h2>
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner message={t('loadingCalendar')} />
      </div>
    </div>
  );
};

const CalendlyStyleDateTimePicker = dynamic(() => import('./CalendlyStyleDateTimePicker'), {
  loading: DateTimePickerLoading,
  ssr: false,
});

// Get the salon's timezone from environment variable or default to Asia/Singapore
const SALON_TIMEZONE = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_TIMEZONE || 'Asia/Singapore';

// Helper function to get the current date in the salon's timezone
const getTodayInSalonTimezone = (): Date => {
  const now = new Date();
  return toZonedTime(now, SALON_TIMEZONE);
};

// Collapsed Step Summary Component
const CollapsedStepSummary: React.FC<{
  selectionType: string;
  selection: string;
  price?: string;
  duration?: string;
  onEdit: () => void;
  id?: string;
}> = ({ selectionType, selection, price, duration, onEdit, id }) => {
  const t = useTranslations('BookingForm');
  return (
    <div
      className="border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4 transition-all duration-200"
      role="region"
      aria-label={`Completed: ${selection}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-2 flex-1 min-w-0 p-3">
          {/* Checkmark */}
          <div className="flex items-center justify-center w-6 h-6 shrink-0">
            <Check strokeWidth={4} className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 id={id} className="text-sm mb-1">
              <span className="text-gray-600">{selectionType}</span>:{' '}
              <b className="text-primary dark:text-gray-300 font-medium">{selection}</b>
            </h3>

            {/* Optional badges */}
            {(price || duration) && (
              <div className="flex items-center gap-2 flex-wrap">
                {price && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {price}
                  </span>
                )}
                {duration && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {duration}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Single Edit button */}
        <Button
          variant="secondary"
          className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 h-auto self-stretch"
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            onEdit();
          }}
          aria-label={`Edit ${selection}`}
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('edit')}</span>
        </Button>
      </div>
    </div>
  );
};

const TimeSlotCard: React.FC<{
  time: string;
  duration: number;
  isSelected: boolean;
  isAvailable: boolean;
  onClick: () => void;
}> = ({ time, duration, isSelected, isAvailable, onClick }) => {
  const endTime = calculateEndTime(time, duration);
  const durationText = formatDuration(duration);
  const t = useTranslations('BookingForm');

  return (
    <button
      disabled={!isAvailable}
      onClick={onClick}
      className={`
        relative p-4 rounded-lg text-left transition-all duration-200
        ${
          isSelected
            ? 'bg-accent ring-2 ring-accent shadow-lg scale-105'
            : isAvailable
              ? 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-accent hover:shadow-md'
              : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed'
        }
      `}
      aria-label={`${time} to ${endTime}, ${durationText}`}
      aria-pressed={isSelected}
    >
      <div className="flex flex-col gap-1">
        {/* Start time - prominent */}
        <span className="text-sm font-bold">{time}</span>

        {/* Duration bar */}
        <div
          className={`mb-1 rounded-full h-1.5 overflow-hidden ${
            isSelected ? 'bg-accent/10' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <div
            className={`h-full transition-all ${
              isSelected ? 'bg-white' : getDurationColor(duration)
            }`}
            style={{ width: `${getDurationPercentage(duration)}%` }}
          />
        </div>

        {/* End time */}
        <span
          className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}
        >
          {t('to')} {endTime}
        </span>

        {/* Duration label */}
        <div
          className={`flex items-center gap-1 text-xs ${
            isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-500'
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{durationText}</span>
        </div>
      </div>
    </button>
  );
};

const DateTimePicker: React.FC<{
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  totalDuration: number;
  selectedStylist: Stylist | null;
}> = ({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeSelect,
  totalDuration,
  selectedStylist,
}) => {
  const t = useTranslations('BookingForm');
  const { getAvailableSlots } = useBooking();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const showLoader = useDelayedLoading(loading, { delay: 150, minDuration: 300 });

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      try {
        const availableSlots = await getAvailableSlots(selectedDate, selectedStylist?.id);
        const slots = availableSlots.map(slot => ({ time: slot, available: true }));
        setTimeSlots(slots);
      } catch (error) {
        console.error('Failed to fetch time slots:', error);
        toast.error('Unable to load available times. Please try another date.');
        setTimeSlots([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedStylist, getAvailableSlots]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-200">
        3. Select Date & Time
      </h2>

      {/* Time Slots */}
      {showLoader ? (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner message={t('findingTimes')} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Available Times for{' '}
              <span className="text-accent dark:text-accent font-bold">
                {format(selectedDate, 'EEEE, MMMM d')}
              </span>
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {timeSlots.length} {timeSlots.length !== 1 ? t('slotsAvailable') : t('slot')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {timeSlots.length > 0 ? (
              timeSlots.map(({ time, available }) => (
                <TimeSlotCard
                  key={time}
                  time={time}
                  duration={totalDuration}
                  isSelected={selectedTime === time}
                  isAvailable={available}
                  onClick={() => onTimeSelect(time)}
                />
              ))
            ) : (
              <div className="col-span-full text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">
                  {t('noSlots')} {format(selectedDate, 'MMMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{t('tryDifferent')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ConfirmationForm: React.FC<{
  onConfirm: (name: string, email: string) => void;
  isSubmitting: boolean;
  whatsappUrl: string;
  showWhatsAppFallback?: boolean;
  selectedCategory?: ServiceCategory | null; // NEW: Category-based booking
  selectedServices: Service[];
  selectedStylist: Stylist | null;
  selectedDate: Date;
  selectedTime: string;
  totalDuration: number;
}> = ({
  onConfirm,
  isSubmitting,
  whatsappUrl,
  showWhatsAppFallback = false,
  selectedCategory,
  selectedServices,
  selectedStylist,
  selectedDate,
  selectedTime,
  totalDuration,
}) => {
  const t = useTranslations('BookingForm');
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Please fill in both your name and email.');
      return;
    }
    setError('');
    onConfirm(name, email);
  };
  return (
    <div>
      <h2
        id="step-4-heading"
        className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200"
      >
        {t('step4')}
      </h2>

      <BookingConfirmationSummary
        selectedCategory={selectedCategory}
        selectedServices={[]} // Empty for category-based booking
        selectedStylist={selectedStylist}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        totalDuration={totalDuration}
      />

      <form onSubmit={handleSubmit} className="max-w-lg bg-gray-50/50 dark:bg-gray-800 rounded-xl">
        <div className="px-6 py-4 space-y-2 mb-2">
          <div className="flex items-center justify-between">
            <div className="text-md font-semibold text-gray-800 dark:text-gray-200">
              {t('bookingUsing')}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user ? t('loggedIn') : t('notLoggedIn')}
            </div>
          </div>
          <InputGroup className="bg-white dark:bg-gray-800">
            <InputGroupInput
              id="name"
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              disabled={!!user}
              required
              className="text-base"
            />
            <InputGroupAddon align="block-start">
              <Label htmlFor="name" className="text-foreground">
                {t('name')}
              </Label>
            </InputGroupAddon>
          </InputGroup>

          <InputGroup className="bg-white dark:bg-gray-800">
            <InputGroupInput
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={!!user}
              required
              className="text-base"
            />
            <InputGroupAddon align="block-start">
              <Label htmlFor="email" className="text-foreground">
                {t('email')}
              </Label>
            </InputGroupAddon>
          </InputGroup>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          variant="default"
          size="lg"
          disabled={isSubmitting}
          className="w-full py-6 text-base"
          aria-label={isSubmitting ? 'Booking in progress' : 'Confirm your appointment'}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {t('booking')}
            </>
          ) : (
            <>
              <Check className="h-6 w-6 mr-2" aria-hidden="true" />
              {t('confirmAppointment')}
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

const BookingSummary: React.FC<{
  selectedServices: Service[];
  selectedStylist: Stylist | null;
  selectedDate: Date;
  selectedTime: string | null;
  totalPrice: number;
  totalDuration: number;
  selectedAddons: string[];
  onClear: () => void;
}> = ({
  selectedServices,
  selectedStylist,
  selectedDate,
  selectedTime,
  totalPrice,
  totalDuration,
  selectedAddons,
  onClear,
}) => {
  const t = useTranslations('BookingForm');
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg sticky top-8">
      <div className="flex justify-between items-center mb-5 border-b pb-4 dark:border-gray-700">
        <h3 className="text-xl font-bold">{t('bookingSummary')}</h3>
        <button onClick={onClear} className="text-sm text-red-500 hover:underline font-semibold">
          {t('clearAll')}
        </button>
      </div>
      {selectedServices.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t('selectServices')}</p>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {selectedServices.map(s => (
              <div key={s.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{s.name}</span>
                  <span className="font-semibold">${s.basePrice}</span>
                </div>
                {s.addons &&
                  s.addons.map(addon => {
                    if (selectedAddons.includes(addon.id)) {
                      return (
                        <div
                          key={addon.id}
                          className="flex justify-between text-xs text-gray-500 pl-4 mt-1"
                        >
                          <span>+ {addon.name}</span>
                          <span>{addon.price}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
              </div>
            ))}
          </div>
          <div className="border-t pt-4 dark:border-gray-700 space-y-2">
            <div className="flex justify-between font-bold text-lg">
              <span>{t('total')}</span>
              <span>${totalPrice}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('totalDuration')}: {totalDuration} {t('mins')}
            </p>
            {selectedStylist && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('stylist')}: <span className="font-semibold">{selectedStylist.name}</span>
              </p>
            )}
            {selectedDate && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('date')}:{' '}
                <span className="font-semibold">{formatDisplayDate(selectedDate)}</span>
              </p>
            )}
            {selectedTime && (
              <p className="text-sm font-bold text-accent dark:text-accent">
                {t('time')}: {selectedTime}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

interface BookingFormProps {
  preSelectedServiceId?: string;
  disableAutoScroll?: boolean;
  onStepChange?: (step: number) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  preSelectedServiceId,
  disableAutoScroll,
  onStepChange,
}) => {
  const t = useTranslations('BookingForm');
  // Get booking categories from context
  const { bookingCategories } = useBookingModal();

  // Category-based booking state (NEW)
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);

  // Common state
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayInSalonTimezone());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<Appointment | null>(null);
  const { createAppointment } = useBooking();

  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  const [editingStep, setEditingStep] = useState<number | null>(null);

  // Refs for scrolling
  const serviceSectionRef = useRef<HTMLDivElement>(null);
  const stylistSectionRef = useRef<HTMLDivElement>(null);
  const dateTimeSectionRef = useRef<HTMLDivElement>(null);
  const confirmationSectionRef = useRef<HTMLDivElement>(null);

  // Track user scrolling to prevent auto-scroll conflicts
  const [userScrolling, setUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // User scroll detection
  useEffect(() => {
    const handleUserScroll = () => {
      setUserScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setUserScrolling(false), 1000);
    };

    window.addEventListener('scroll', handleUserScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleUserScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Clear selections based on current step
        if (selectedTime) setSelectedTime(null);
        else if (selectedStylist) {
          setSelectedStylist(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTime, selectedStylist]);

  // Auto-select category when pre-selected service ID (actually slug) is provided
  // Maps service detail page slugs to booking categories
  useEffect(() => {
    if (preSelectedServiceId && !selectedCategory) {
      // preSelectedServiceId is actually a slug like 'hair-colouring' from navigation.ts
      const category = bookingCategories.find(c => c.slug === preSelectedServiceId);
      if (category) {
        setSelectedCategory(category);

        // Only show toast and scroll if auto-scroll is enabled (i.e., not on service detail pages)
        if (!disableAutoScroll) {
          toast.success(`${category.title} has been pre-selected for you!`);

          setTimeout(() => {
            const element = document.getElementById('service-selector');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 500);
        }
      }
    }
  }, [preSelectedServiceId, selectedCategory, disableAutoScroll, bookingCategories]);

  // Smart reset logic: only reset when necessary
  useEffect(() => {
    // Always reset time when date changes
    setSelectedTime(null);
  }, [selectedDate]);

  // Reset stylist only when category is cleared
  useEffect(() => {
    if (!selectedCategory) {
      setSelectedStylist(null);
    }
  }, [selectedCategory]);

  // Update current step based on selection state
  useEffect(() => {
    let newStep = 1;
    if (bookingConfirmed) {
      newStep = 4; // Completed
    } else if (selectedTime) {
      newStep = 4; // Confirmation
    } else if (selectedCategory && selectedStylist) {
      newStep = 3; // Date & Time
    } else if (selectedCategory) {
      newStep = 2; // Stylist
    } else {
      newStep = 1; // Category Selection
    }

    setCurrentStep(newStep);
    onStepChange?.(newStep);
  }, [selectedCategory, selectedStylist, selectedTime, bookingConfirmed, onStepChange]);

  // Scroll helper
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    // Don't auto-scroll if user is manually scrolling
    if (userScrolling) return;

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Small delay to allow UI to update
    setTimeout(() => {
      if (ref.current) {
        ref.current.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
        // Set focus for accessibility
        ref.current.focus();
      }
    }, 300);
  };

  // Category-based duration (no price since it varies)
  const { totalPrice, totalDuration } = useMemo((): {
    totalPrice: number;
    totalDuration: number;
  } => {
    if (selectedCategory) {
      return {
        totalPrice: 0, // Price not determined until appointment
        totalDuration: selectedCategory.estimatedDuration ?? 0,
      };
    }
    return { totalPrice: 0, totalDuration: 0 };
  }, [selectedCategory]);

  // Generate WhatsApp URL with booking details
  const whatsappUrl = useMemo(() => {
    const whatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '15551234567';

    const message = `Hi! I'd like to book an appointment:

Service Category: ${selectedCategory?.title || 'Not selected'}${
      selectedStylist ? `\nStylist: ${selectedStylist.name}` : ''
    }
Date: ${format(selectedDate, 'EEEE, MMMM d, yyyy')}${selectedTime ? `\nTime: ${selectedTime}` : ''}

Please confirm availability. Thank you!`;

    return `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(message)}`;
  }, [selectedCategory, selectedStylist, selectedDate, selectedTime]);

  // Category selection handler
  const handleCategorySelect = (category: ServiceCategory) => {
    setSelectedCategory(category);
    // Clear editing state when user makes a selection
    setEditingStep(null);
    // Auto-advance to Step 2 (Stylist) with a small delay
    setTimeout(() => scrollToSection(stylistSectionRef), 300);
  };

  const handleStylistSelect = (stylist: Stylist | null) => {
    setSelectedStylist(stylist);
    // Clear editing state when user makes a selection
    setEditingStep(null);
    // Auto-scroll to date time picker
    scrollToSection(dateTimeSectionRef);
  };

  const handleTimeSelect = (time: string | null) => {
    setSelectedTime(time);
    // Clear editing state when user makes a selection
    setEditingStep(null);
    if (time) {
      // Auto-scroll to confirmation
      scrollToSection(confirmationSectionRef);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && selectedCategory) {
      scrollToSection(stylistSectionRef);
    } else if (currentStep === 2) {
      scrollToSection(dateTimeSectionRef);
    } else if (currentStep === 3 && selectedTime) {
      scrollToSection(confirmationSectionRef);
    }
  };

  const handleConfirmBooking = async (name: string, email: string) => {
    if (!selectedTime || !selectedCategory) {
      toast.error('Please select a service category, date, and time before booking.');
      return;
    }
    setIsSubmitting(true);

    const toastId = toast.loading('Booking your appointment...');
    try {
      const confirmedAppt = await createAppointment({
        date: selectedDate,
        time: selectedTime,
        services: [], // Empty for category-based booking
        stylistId: selectedStylist?.id,
        customerName: name,
        customerEmail: email,
        // Category-based fields
        categoryId: selectedCategory.id,
        estimatedDuration: selectedCategory.estimatedDuration ?? 0,
      });
      setBookingConfirmed(confirmedAppt);
      toast.success('Appointment booked successfully! Confirmation sent to your email.', {
        id: toastId,
      });
    } catch (error: any) {
      toast.error(`Booking failed: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedCategory(null);
    setSelectedStylist(null);
    setSelectedDate(getTodayInSalonTimezone());
    setSelectedTime(null);
    setBookingConfirmed(null);
    setCurrentStep(1);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditStep = (step: number) => {
    // Set editing state to override normal step calculation
    setEditingStep(step);

    // Clear dependent selections
    if (step === 1) {
      // Editing services - clear stylist and time
      setSelectedStylist(null);
      setSelectedTime(null);
    } else if (step === 2) {
      // Editing stylist - clear time only
      setSelectedTime(null);
    } else if (step === 3) {
      // Editing date/time - clear time
      setSelectedTime(null);
    }

    // Scroll to step
    const refs = [
      null,
      serviceSectionRef,
      stylistSectionRef,
      dateTimeSectionRef,
      confirmationSectionRef,
    ];
    if (refs[step]) {
      scrollToSection(refs[step]!);
    }
  };

  if (bookingConfirmed) {
    return (
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg max-w-lg mx-auto">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-800">
          <Check className="h-10 w-10 text-green-600 dark:text-green-300" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          Booking Confirmed!
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Thank you, {bookingConfirmed.customerName}.
        </p>
        <div className="mt-6 text-left bg-gray-50 dark:bg-gray-700 p-4 rounded-md space-y-2">
          <p>
            <strong>Service Category:</strong> {bookingConfirmed.category?.title || 'N/A'}
          </p>
          {bookingConfirmed.stylist && (
            <p>
              <strong>Stylist:</strong> {bookingConfirmed.stylist.name}
            </p>
          )}
          <p>
            <strong>Date:</strong> {formatDisplayDate(bookingConfirmed.date)}
          </p>
          <p>
            <strong>Time:</strong> {bookingConfirmed.time}
          </p>
          {bookingConfirmed.estimatedDuration && (
            <p>
              <strong>Estimated Duration:</strong> {bookingConfirmed.estimatedDuration} minutes
            </p>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          A confirmation has been sent to {bookingConfirmed.customerEmail}.
        </p>
        <Button variant="default" size="default" onClick={handleReset} className="mt-6">
          Make Another Booking
        </Button>
      </div>
    );
  }

  return (
    <div className="relative pb-24 lg:pb-0">
      {/* Step Indicator - Moved to BookingModal header */}
      {/* <div className="mb-8">
        <SimpleStepIndicator
          currentStep={currentStep}
          totalSteps={4}
          stepLabels={['Services', 'Stylist', 'Date & Time', 'Confirm']}
        />
      </div> */}

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {currentStep === 1 && 'Step 1 of 4: Select Services'}
        {currentStep === 2 && 'Step 2 of 4: Choose Your Stylist'}
        {currentStep === 3 && 'Step 3 of 4: Select Date and Time'}
        {currentStep === 4 && 'Step 4 of 4: Confirm Your Booking'}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Services */}
          <div
            ref={serviceSectionRef}
            tabIndex={-1}
            className="outline-none"
            role="group"
            aria-labelledby="step-1-heading"
            aria-current={currentStep === 1 ? 'step' : undefined}
          >
            {currentStep > 1 && selectedCategory && editingStep !== 1 ? (
              <CollapsedStepSummary
                selectionType="Service"
                selection={`${selectedCategory.title}`}
                onEdit={() => handleEditStep(1)}
                id="step-1-heading"
              />
            ) : (
              <SimpleCategorySelector
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
              />
            )}
          </div>

          {/* Step 2: Stylist */}
          {selectedCategory && editingStep !== 1 && (
            <div
              ref={stylistSectionRef}
              className="outline-none"
              role="group"
              aria-labelledby="step-2-heading"
              aria-current={currentStep === 2 ? 'step' : undefined}
            >
              {currentStep > 2 && selectedStylist && editingStep !== 2 ? (
                <CollapsedStepSummary
                  selectionType="Stylist"
                  selection={selectedStylist ? selectedStylist.name : 'No preference (Quick Book)'}
                  onEdit={() => handleEditStep(2)}
                  id="step-2-heading"
                />
              ) : (
                <div className="animate-slide-in-bottom">
                  <StylistSelector
                    selectedServices={[]} // Pass empty array for category-based booking
                    selectedCategory={selectedCategory} // NEW: Pass category for category-based booking
                    selectedStylist={selectedStylist}
                    onStylistSelect={handleStylistSelect}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Date & Time */}
          {selectedStylist && selectedCategory && editingStep !== 1 && editingStep !== 2 && (
            <div
              ref={dateTimeSectionRef}
              className="outline-none"
              role="group"
              aria-labelledby="step-3-heading"
              aria-current={currentStep === 3 ? 'step' : undefined}
            >
              {currentStep > 3 && selectedTime && editingStep !== 3 ? (
                <CollapsedStepSummary
                  selectionType="Date & Time"
                  selection={`${formatDisplayDate(selectedDate)}, ${formatTimeDisplay(selectedTime)}`}
                  duration={`${totalDuration} min`}
                  onEdit={() => handleEditStep(3)}
                  id="step-3-heading"
                />
              ) : (
                <div className="animate-slide-in-bottom">
                  <CalendlyStyleDateTimePicker
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    selectedTime={selectedTime}
                    onTimeSelect={handleTimeSelect}
                    totalDuration={totalDuration}
                    selectedStylist={selectedStylist}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirmation */}
          {selectedTime && editingStep !== 1 && editingStep !== 2 && editingStep !== 3 && (
            <div
              ref={confirmationSectionRef}
              className="outline-none animate-scale-in"
              role="group"
              aria-labelledby="step-4-heading"
              aria-current={currentStep === 4 ? 'step' : undefined}
            >
              <ConfirmationForm
                onConfirm={handleConfirmBooking}
                isSubmitting={isSubmitting}
                whatsappUrl={whatsappUrl}
                showWhatsAppFallback={!isSubmitting}
                selectedCategory={selectedCategory}
                selectedServices={[]} // Empty for category-based booking
                selectedStylist={selectedStylist}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                totalDuration={totalDuration}
              />
            </div>
          )}
        </div>
        <div className="lg:col-span-1 hidden lg:block">
          <BookingSummary
            selectedServices={[]} // Empty for category-based booking
            selectedStylist={selectedStylist}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            totalPrice={totalPrice}
            totalDuration={totalDuration}
            selectedAddons={[]} // Empty for category-based booking
            onClear={handleReset}
          />
        </div>
        {/* To buffer sticky summary on mobile */}
        <div className={`${currentStep === 4 ? 'pb-4' : 'pb-16'}`}></div>
      </div>

      {/* Mobile Sticky Summary */}
      <MobileBookingSummary
        totalPrice={totalPrice}
        totalDuration={totalDuration}
        currentStep={currentStep}
        totalSteps={4}
        onNext={handleNextStep}
        nextLabel={
          currentStep === 1
            ? 'Choose Stylist'
            : currentStep === 2
              ? 'Select Time'
              : currentStep === 3
                ? 'Confirm'
                : 'Book Now'
        }
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default BookingForm;

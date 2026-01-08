'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

import type { Appointment, Stylist, ServiceCategory } from '@/types';
import { useBooking } from '@/context/BookingContext';
import { useBookingModal } from '@/context/BookingModalContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Check, CalendarPlus, ChevronDown } from '@/lib/icons';
import { useTranslations, useFormatter } from 'next-intl';
import {
  generateGoogleCalendarUrl,
  createCalendarEventFromBooking,
  downloadIcsFile,
} from '@/lib/calendarUtils';

// Imports from subfolders
import { SimpleCategorySelector } from './step1-service';
import { ConfirmationForm } from './step4-confirmation';
import {
  getTodayInSalonTimezone,
  StylistSelectorLoading,
  DateTimePickerLoading,
  CollapsedStepSummary,
  BookingSummary,
  AnimatedStepContainer,
  StepHeader,
} from './shared';

// Code-split heavy components for better performance
const StylistSelector = dynamic(
  () => import('./step2-stylist/StylistSelector').then(mod => ({ default: mod.StylistSelector })),
  {
    loading: StylistSelectorLoading,
    ssr: false,
  },
);

const DateTimePicker = dynamic(() => import('./step3-datetime/DateTimePicker'), {
  loading: DateTimePickerLoading,
  ssr: false,
});

interface BookingFormProps {
  preSelectedCategorySlug?: string;
  preSelectedCategoryId?: string;
  disableAutoScroll?: boolean;
  onStepChange?: (step: number) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  preSelectedCategorySlug,
  preSelectedCategoryId,
  disableAutoScroll,
  onStepChange,
}) => {
  const t = useTranslations('BookingForm');
  const tNav = useTranslations('Navigation');
  const formatter = useFormatter();

  // i18n date/time formatting helpers
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatter.dateTime(dateObj, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return formatter.dateTime(date, { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Get booking categories from context
  const { bookingCategories } = useBookingModal();

  // Category-based booking state (NEW)
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);

  // Helper function to get translated category name
  const getCategoryName = (category: ServiceCategory | null) => {
    if (!category) return '';
    return tNav(`serviceNames.${category.slug}`, { default: category.title });
  };

  // Common state
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayInSalonTimezone());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<Appointment | null>(null);
  const { createAppointment } = useBooking();

  const [currentStep, setCurrentStep] = useState(1);
  const [editingStep, setEditingStep] = useState<number | null>(null);

  // Pre-selection/selection animation states for all steps
  const [isPreSelectionAnimating, setIsPreSelectionAnimating] = useState(false);
  const [isStylistAnimating, setIsStylistAnimating] = useState(false);
  const [isTimeAnimating, setIsTimeAnimating] = useState(false);

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

  // Ref to track if component is mounted
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Ref to track if pre-selection animation has run
  const hasHandledPreSelection = useRef(false);

  // Auto-select category when pre-selected service ID (actually slug) is provided
  // Maps service detail page slugs to booking categories
  useEffect(() => {
    // Prevent re-running if already handled
    if (hasHandledPreSelection.current) return;

    let categoryToSelect: ServiceCategory | undefined;

    // 1. Resolve the category
    if (preSelectedCategoryId) {
      categoryToSelect = bookingCategories.find(c => c.id === preSelectedCategoryId);
    } else if (preSelectedCategorySlug) {
      categoryToSelect = bookingCategories.find(c => c.slug === preSelectedCategorySlug);
    }

    // 2. Execute Pre-selection Animation with pulse feedback
    if (categoryToSelect && !selectedCategory) {
      hasHandledPreSelection.current = true;

      // Stage 1: Select category with pulse animation
      setTimeout(() => {
        if (isMounted.current) {
          setIsPreSelectionAnimating(true);
          setSelectedCategory(categoryToSelect!);
        }
      }, 400);

      // Stage 2: Stop pulse animation (after 1.5 seconds of pulsing)
      setTimeout(() => {
        if (isMounted.current) {
          setIsPreSelectionAnimating(false);
        }
      }, 1900);

      // Stage 3: Scroll to next step (after user has seen feedback)
      setTimeout(() => {
        if (isMounted.current) {
          const element =
            document.getElementById('stylist-selector-section') || stylistSectionRef.current;
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 2500);
    }
  }, [preSelectedCategorySlug, preSelectedCategoryId, selectedCategory, bookingCategories]);

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
    setEditingStep(null);

    // Pulse animation + delay before collapse (same pattern as Steps 2 and 3)
    setIsPreSelectionAnimating(true);
    setTimeout(() => {
      setIsPreSelectionAnimating(false);
      scrollToSection(stylistSectionRef);
    }, 1200); // 1.2s to show pulse before advancing
  };

  const handleStylistSelect = (stylist: Stylist | null) => {
    setSelectedStylist(stylist);
    setEditingStep(null);

    // Pulse animation + delay before collapse
    setIsStylistAnimating(true);
    setTimeout(() => {
      setIsStylistAnimating(false);
      scrollToSection(dateTimeSectionRef);
    }, 1200); // 1.2s to show pulse before advancing
  };

  const handleTimeSelect = (time: string | null) => {
    setSelectedTime(time);
    setEditingStep(null);
    if (time) {
      // Pulse animation + delay before collapse
      setIsTimeAnimating(true);
      setTimeout(() => {
        setIsTimeAnimating(false);
        scrollToSection(confirmationSectionRef);
      }, 1200); // 1.2s to show pulse before advancing
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

      // Check if deposit is required
      const depositResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: confirmedAppt.id,
          totalPrice: confirmedAppt.totalPrice || selectedCategory.priceRangeMin || 5000, // in cents
          customerEmail: email,
          customerName: name,
        }),
      });

      const depositData = (await depositResponse.json()) as {
        required: boolean;
        paymentUrl?: string;
        error?: string;
      };

      if (depositData.required && depositData.paymentUrl) {
        // Redirect to payment
        toast.loading('Redirecting to payment...', { id: toastId });
        window.location.href = depositData.paymentUrl;
        return;
      }

      // No deposit required - show confirmation
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

  // State for calendar dropdown
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState(false);

  // Handle adding to Google Calendar
  const handleAddToGoogleCalendar = () => {
    if (!bookingConfirmed) return;

    const serviceName = bookingConfirmed.category
      ? getCategoryName(bookingConfirmed.category as ServiceCategory)
      : 'Appointment';
    const stylistName = bookingConfirmed.stylist?.name || null;
    const appointmentDate = new Date(bookingConfirmed.date);
    const duration = bookingConfirmed.estimatedDuration || 60;

    const event = createCalendarEventFromBooking(
      serviceName,
      stylistName,
      appointmentDate,
      bookingConfirmed.time,
      duration,
    );

    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank');
    setCalendarDropdownOpen(false);
  };

  // Handle downloading iCal file
  const handleAddToAppleCalendar = () => {
    if (!bookingConfirmed) return;

    const serviceName = bookingConfirmed.category
      ? getCategoryName(bookingConfirmed.category as ServiceCategory)
      : 'Appointment';
    const stylistName = bookingConfirmed.stylist?.name || null;
    const appointmentDate = new Date(bookingConfirmed.date);
    const duration = bookingConfirmed.estimatedDuration || 60;

    const event = createCalendarEventFromBooking(
      serviceName,
      stylistName,
      appointmentDate,
      bookingConfirmed.time,
      duration,
    );

    downloadIcsFile(event);
    setCalendarDropdownOpen(false);
  };

  if (bookingConfirmed) {
    return (
      <div className="text-center p-6 bg-white rounded-lg max-w-lg mx-auto">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">{t('bookingConfirmed')}</h2>

        <div className="mt-6 text-left bg-primary-50 p-4 rounded-md space-y-2 text-gray-700">
          {t('thankYou')}, {bookingConfirmed.customerName}. Your{' '}
          <strong>
            {bookingConfirmed.category
              ? getCategoryName(bookingConfirmed.category as ServiceCategory)
              : 'N/A'}
          </strong>{' '}
          appointment has been confirmed with {bookingConfirmed.stylist?.name} on{' '}
          {format(new Date(bookingConfirmed.date), 'MMMM d, yyyy')} at {bookingConfirmed.time}.
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {bookingConfirmed.customerEmail.endsWith('@whatsapp.local')
            ? `${t('confirmationSentWhatsApp')} ${bookingConfirmed.customerEmail.split('@')[0]}.`
            : bookingConfirmed.customerEmail.endsWith('@telegram.local')
              ? t('confirmationSentTelegram')
              : `${t('confirmationSent')} ${bookingConfirmed.customerEmail}.`}
        </p>

        {/* Add to Calendar Dropdown */}
        <div className="mt-6 relative inline-block">
          <Button
            variant="outline"
            size="default"
            onClick={() => setCalendarDropdownOpen(!calendarDropdownOpen)}
            className="w-full flex items-center justify-center gap-2"
          >
            <CalendarPlus className="h-4 w-4" />
            {t('addToCalendar')}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${calendarDropdownOpen ? 'rotate-180' : ''}`}
            />
          </Button>

          {calendarDropdownOpen && (
            <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg">
              <button
                onClick={handleAddToGoogleCalendar}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    fill="#4285F4"
                  />
                  <path d="M12 7V12L15.5 14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {t('googleCalendar')}
              </button>
              <button
                onClick={handleAddToAppleCalendar}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#333" strokeWidth="2" />
                  <path
                    d="M16 2V6M8 2V6M3 10H21"
                    stroke="#333"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {t('appleCalendar')}
              </button>
            </div>
          )}
        </div>

        <Button variant="default" size="default" onClick={handleReset} className="mt-4 w-full">
          {t('makeAnotherBooking')}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {currentStep === 1 && t('ariaStep1')}
        {currentStep === 2 && t('ariaStep2')}
        {currentStep === 3 && t('ariaStep3')}
        {currentStep === 4 && t('ariaStep4')}
      </div>

      <div className="gap-8 sm:p-6 pb-12 sm:pb-0">
        <div className="w-full">
          {/* Step 1: Services */}
          <div
            ref={serviceSectionRef}
            tabIndex={-1}
            className="outline-none -mx-4 sm:-mx-6 sm:-mt-6"
            role="group"
            aria-labelledby="step-1-heading"
            aria-current={currentStep === 1 ? 'step' : undefined}
          >
            <AnimatedStepContainer
              isCollapsed={
                currentStep > 1 &&
                !!selectedCategory &&
                editingStep !== 1 &&
                !isPreSelectionAnimating
              }
              collapsedContent={
                <div className="px-4 sm:px-6 pt-6">
                  <CollapsedStepSummary
                    selectionType={t('service')}
                    selection={getCategoryName(selectedCategory!)}
                    onEdit={() => handleEditStep(1)}
                    id="step-1-heading"
                  />
                </div>
              }
              expandedContent={
                <SimpleCategorySelector
                  selectedCategory={selectedCategory}
                  onCategorySelect={handleCategorySelect}
                  isPreSelectionAnimating={isPreSelectionAnimating}
                />
              }
            />
          </div>

          {/* Step 2: Stylist */}
          {selectedCategory && editingStep !== 1 && !isPreSelectionAnimating && (
            <div
              ref={stylistSectionRef}
              className="outline-none -mx-4 sm:-mx-6"
              role="group"
              aria-labelledby="step-2-heading"
              aria-current={currentStep === 2 ? 'step' : undefined}
            >
              <AnimatedStepContainer
                isCollapsed={
                  currentStep > 2 && !!selectedStylist && editingStep !== 2 && !isStylistAnimating
                }
                collapsedContent={
                  <div className="px-4 sm:px-6">
                    <CollapsedStepSummary
                      selectionType={t('stylist')}
                      selection={
                        selectedStylist ? selectedStylist.name : t('noPreferenceQuickBook')
                      }
                      onEdit={() => handleEditStep(2)}
                      id="step-2-heading"
                    />
                  </div>
                }
                expandedContent={
                  <div className="animate-slide-in-bottom">
                    <StylistSelector
                      selectedServices={[]}
                      selectedCategory={selectedCategory}
                      selectedStylist={selectedStylist}
                      onStylistSelect={handleStylistSelect}
                      isAnimatingSelection={isStylistAnimating}
                    />
                  </div>
                }
              />
            </div>
          )}

          {/* Step 3: Date & Time */}
          {selectedStylist &&
            selectedCategory &&
            editingStep !== 1 &&
            editingStep !== 2 &&
            !isStylistAnimating && (
              <div
                ref={dateTimeSectionRef}
                className="outline-none -mx-4 sm:-mx-6"
                role="group"
                aria-labelledby="step-3-heading"
                aria-current={currentStep === 3 ? 'step' : undefined}
              >
                <AnimatedStepContainer
                  isCollapsed={
                    currentStep > 3 && !!selectedTime && editingStep !== 3 && !isTimeAnimating
                  }
                  collapsedContent={
                    <div className="px-4 sm:px-6">
                      <CollapsedStepSummary
                        selectionType={t('dateAndTime')}
                        selection={`${formatDate(selectedDate)}, ${formatTime(selectedTime || '')}`}
                        onEdit={() => handleEditStep(3)}
                        id="step-3-heading"
                      />
                    </div>
                  }
                  expandedContent={
                    <div className="animate-slide-in-bottom">
                      <StepHeader title={t('step3')} />
                      <div className="px-4 sm:px-6">
                        <DateTimePicker
                          selectedDate={selectedDate}
                          onDateChange={setSelectedDate}
                          selectedTime={selectedTime}
                          onTimeSelect={handleTimeSelect}
                          totalDuration={totalDuration}
                          selectedStylist={selectedStylist}
                          isAnimatingSelection={isTimeAnimating}
                        />
                      </div>
                    </div>
                  }
                />
              </div>
            )}

          {/* Step 4: Confirmation */}
          {selectedTime &&
            editingStep !== 1 &&
            editingStep !== 2 &&
            editingStep !== 3 &&
            !isTimeAnimating && (
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
                  selectedCategory={selectedCategory}
                  selectedStylist={selectedStylist}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  totalDuration={totalDuration}
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BookingForm;

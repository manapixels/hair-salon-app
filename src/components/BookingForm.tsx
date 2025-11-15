import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { SALON_SERVICES } from '@/constants';
import type { Service, TimeSlot, Appointment, Stylist } from '@/types';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/context/AuthContext';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import {
  calculateEndTime,
  formatDuration,
  getDurationColor,
  getDurationPercentage,
  formatDisplayDate,
} from '@/lib/timeUtils';
import CalendlyStyleDateTimePicker from './booking/CalendlyStyleDateTimePicker';
import { LoadingSpinner } from './loaders/LoadingSpinner';
import { StylistCardSkeleton } from './loaders/StylistCardSkeleton';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { TextField } from './ui/TextField';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Check, CheckCircle, User, WhatsAppIcon } from '@/lib/icons';

// Get the salon's timezone from environment variable or default to Asia/Singapore
const SALON_TIMEZONE = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_TIMEZONE || 'Asia/Singapore';

// Helper function to get the current date in the salon's timezone
const getTodayInSalonTimezone = (): Date => {
  const now = new Date();
  return toZonedTime(now, SALON_TIMEZONE);
};

const ServiceSelector: React.FC<{
  selectedServices: Service[];
  onServiceToggle: (service: Service) => void;
}> = ({ selectedServices, onServiceToggle }) => (
  <div>
    <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
      1. Select Services
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {SALON_SERVICES.map(service => {
        const isSelected = selectedServices.some(s => s.id === service.id);
        return (
          <Card
            key={service.id}
            variant="interactive"
            selected={isSelected}
            showCheckmark
            onClick={() => onServiceToggle(service)}
            className="cursor-pointer"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{service.name}</CardTitle>
                <span className="text-[length:var(--font-size-5)] font-semibold text-[var(--gray-12)]">
                  ${service.price}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-[length:var(--font-size-2)] text-[var(--gray-11)] mb-2">
                {service.description}
              </p>
              <p className="text-[length:var(--font-size-1)] text-[var(--gray-10)]">
                {service.duration} mins
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </div>
);

const StylistSelector: React.FC<{
  selectedServices: Service[];
  selectedStylist: Stylist | null;
  onStylistSelect: (stylist: Stylist | null) => void;
}> = ({ selectedServices, selectedStylist, onStylistSelect }) => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delayed loading to prevent flash on fast connections
  const showLoader = useDelayedLoading(loading, { delay: 150, minDuration: 300 });

  // Extract fetch function so it can be reused for retry
  const fetchStylists = useCallback(async () => {
    if (selectedServices.length === 0) {
      setStylists([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const serviceIds = selectedServices.map(s => s.id);
      const response = await fetch(`/api/stylists?services=${serviceIds.join(',')}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch stylists: ${response.status}`);
      }

      const availableStylists = await response.json();

      // Validate response is an array
      if (!Array.isArray(availableStylists)) {
        console.error('Invalid response format:', availableStylists);
        throw new Error('Invalid response format from server');
      }

      setStylists(availableStylists);
    } catch (error) {
      console.error('Failed to fetch stylists:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unable to load stylists';
      setError(errorMsg);
      toast.error(errorMsg);
      setStylists([]);
    } finally {
      setLoading(false);
    }
  }, [selectedServices]);

  useEffect(() => {
    fetchStylists();
  }, [fetchStylists]);

  if (selectedServices.length === 0) {
    return null;
  }

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        2. Choose Your Stylist
      </h2>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {loading && 'Loading stylists for your selected services'}
        {!loading && stylists.length > 0 && `${stylists.length} stylists available`}
        {!loading && stylists.length === 0 && 'No stylists available'}
      </div>

      {showLoader ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <LoadingSpinner size="sm" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Finding stylists who can perform {selectedServices.map(s => s.name).join(', ')}...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StylistCardSkeleton count={3} />
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to Load Stylists"
          message={error}
          onRetry={fetchStylists}
          retryText="Try Again"
        />
      ) : stylists.length === 0 ? (
        <EmptyState
          icon={
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
          title="No Stylists Available"
          description="No stylists can perform the selected services. Try selecting different services or contact us for assistance."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {stylists.map(stylist => {
              const isSelected = selectedStylist?.id === stylist.id;
              return (
                <Card
                  key={stylist.id}
                  variant="interactive"
                  selected={isSelected}
                  showCheckmark
                  onClick={() => onStylistSelect(stylist)}
                  className="cursor-pointer"
                >
                  <CardContent>
                    <div className="flex items-center mb-4">
                      {stylist.avatar ? (
                        <Image
                          src={stylist.avatar}
                          alt={stylist.name}
                          width={52}
                          height={52}
                          className="w-13 h-13 rounded-full mr-4"
                        />
                      ) : (
                        <div className="w-13 h-13 bg-[var(--gray-3)] rounded-full flex items-center justify-center mr-4">
                          <User className="h-8 w-8 text-[var(--gray-9)]" aria-hidden="true" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-[length:var(--font-size-4)] font-bold text-[var(--gray-12)]">
                          {stylist.name}
                        </h3>
                        <p className="text-[length:var(--font-size-2)] text-[var(--gray-11)]">
                          {stylist.email}
                        </p>
                      </div>
                    </div>
                    {stylist.bio && (
                      <p className="text-[length:var(--font-size-2)] text-[var(--gray-11)] mb-3">
                        {stylist.bio}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {stylist.specialties.slice(0, 3).map(service => (
                        <span
                          key={service.id}
                          className={`text-[length:var(--font-size-1)] px-2.5 py-1 rounded-full ${
                            isSelected
                              ? 'bg-[var(--accent-9)] text-white'
                              : 'bg-[var(--gray-3)] text-[var(--gray-11)]'
                          }`}
                        >
                          {service.name}
                        </span>
                      ))}
                      {stylist.specialties.length > 3 && (
                        <span
                          className={`text-[length:var(--font-size-1)] px-2.5 py-1 rounded-full ${
                            isSelected
                              ? 'bg-[var(--accent-9)] text-white'
                              : 'bg-[var(--gray-3)] text-[var(--gray-11)]'
                          }`}
                        >
                          +{stylist.specialties.length - 3}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="flex justify-center mt-6">
            <Button
              variant={selectedStylist === null ? 'solid' : 'soft'}
              size="md"
              onClick={() => onStylistSelect(null)}
            >
              No Preference
            </Button>
          </div>
        </>
      )}
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
            isSelected ? 'bg-accent-soft' : 'bg-gray-200 dark:bg-gray-700'
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
          to {endTime}
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
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
        3. Select Date & Time
      </h2>

      {/* Time Slots */}
      {showLoader ? (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner message="Finding available times..." />
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
              {timeSlots.length} slot{timeSlots.length !== 1 ? 's' : ''} available
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
                  No available slots on {format(selectedDate, 'MMMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Try selecting a different date, or contact us for assistance
                </p>
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
}> = ({ onConfirm, isSubmitting, whatsappUrl, showWhatsAppFallback = false }) => {
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
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        4. Confirm Your Booking
      </h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-lg bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
      >
        <TextField
          label="Full Name"
          id="name"
          type="text"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          disabled={!!user}
          required
        />
        <TextField
          label="Email Address"
          id="email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          disabled={!!user}
          required
        />
        {error && <p className="text-[length:var(--font-size-2)] text-[var(--red-11)]">{error}</p>}
        <Button
          type="submit"
          variant="solid"
          size="lg"
          fullWidth
          loading={isSubmitting}
          loadingText="Booking..."
          disabled={isSubmitting}
          className="py-4 text-[length:var(--font-size-4)]"
          aria-label={isSubmitting ? 'Booking in progress' : 'Confirm your appointment'}
        >
          <CheckCircle className="h-6 w-6" aria-hidden="true" />
          Confirm Appointment
        </Button>

        {/* WhatsApp Fallback */}
        {showWhatsAppFallback && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
              Prefer personal assistance?
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
              aria-label="Contact us on WhatsApp for booking assistance"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Chat with us on WhatsApp
            </a>
          </div>
        )}
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
  onClear: () => void;
}> = ({
  selectedServices,
  selectedStylist,
  selectedDate,
  selectedTime,
  totalPrice,
  totalDuration,
  onClear,
}) => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg sticky top-8">
      <div className="flex justify-between items-center mb-5 border-b pb-4 dark:border-gray-700">
        <h3 className="text-xl font-bold">Booking Summary</h3>
        <button onClick={onClear} className="text-sm text-red-500 hover:underline font-semibold">
          Clear All
        </button>
      </div>
      {selectedServices.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Select services to get started.</p>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {selectedServices.map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{s.name}</span>
                <span className="font-semibold">${s.price}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 dark:border-gray-700 space-y-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${totalPrice}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Duration: {totalDuration} mins
            </p>
            {selectedStylist && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Stylist: <span className="font-semibold">{selectedStylist.name}</span>
              </p>
            )}
            {selectedDate && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Date: <span className="font-semibold">{formatDisplayDate(selectedDate)}</span>
              </p>
            )}
            {selectedTime && (
              <p className="text-sm font-bold text-accent dark:text-accent">Time: {selectedTime}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const BookingForm: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayInSalonTimezone());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<Appointment | null>(null);
  const { createAppointment } = useBooking();

  // Smart reset logic: only reset when necessary
  useEffect(() => {
    // Always reset time when date changes
    setSelectedTime(null);
  }, [selectedDate]);

  // Reset stylist only when services change (but StylistSelector will handle this more intelligently)
  useEffect(() => {
    if (selectedServices.length === 0) {
      setSelectedStylist(null);
    }
  }, [selectedServices]);

  const { totalPrice, totalDuration } = useMemo(() => {
    return selectedServices.reduce(
      (acc, service) => {
        acc.totalPrice += service.price;
        acc.totalDuration += service.duration;
        return acc;
      },
      { totalPrice: 0, totalDuration: 0 },
    );
  }, [selectedServices]);

  // Generate WhatsApp URL with booking details
  const whatsappUrl = useMemo(() => {
    const whatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '15551234567';

    const message = `Hi! I'd like to book an appointment:

Services: ${selectedServices.map(s => s.name).join(', ')}${
      selectedStylist ? `\nStylist: ${selectedStylist.name}` : ''
    }
Date: ${format(selectedDate, 'EEEE, MMMM d, yyyy')}${selectedTime ? `\nTime: ${selectedTime}` : ''}

Please confirm availability. Thank you!`;

    return `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(message)}`;
  }, [selectedServices, selectedStylist, selectedDate, selectedTime]);

  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleConfirmBooking = async (name: string, email: string) => {
    if (!selectedTime || selectedServices.length === 0) {
      toast.error('Please select services, a date, and a time before booking.');
      return;
    }
    setIsSubmitting(true);

    const toastId = toast.loading('Booking your appointment...');
    try {
      const confirmedAppt = await createAppointment({
        date: selectedDate,
        time: selectedTime,
        services: selectedServices,
        stylistId: selectedStylist?.id,
        customerName: name,
        customerEmail: email,
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
    setSelectedServices([]);
    setSelectedStylist(null);
    setSelectedDate(getTodayInSalonTimezone());
    setSelectedTime(null);
    setBookingConfirmed(null);
  };

  if (bookingConfirmed) {
    return (
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg mx-auto">
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
            <strong>Services:</strong> {bookingConfirmed.services.map(s => s.name).join(', ')}
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
          <p>
            <strong>Total:</strong> ${bookingConfirmed.totalPrice}
          </p>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          A confirmation has been sent to {bookingConfirmed.customerEmail}.
        </p>
        <Button variant="solid" size="md" onClick={handleReset} className="mt-6">
          Make Another Booking
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <ServiceSelector
          selectedServices={selectedServices}
          onServiceToggle={handleServiceToggle}
        />

        {selectedServices.length > 0 && (
          <StylistSelector
            selectedServices={selectedServices}
            selectedStylist={selectedStylist}
            onStylistSelect={setSelectedStylist}
          />
        )}

        {selectedServices.length > 0 && (
          <CalendlyStyleDateTimePicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedTime={selectedTime}
            onTimeSelect={setSelectedTime}
            totalDuration={totalDuration}
            selectedStylist={selectedStylist}
          />
        )}

        {selectedTime && (
          <ConfirmationForm
            onConfirm={handleConfirmBooking}
            isSubmitting={isSubmitting}
            whatsappUrl={whatsappUrl}
            showWhatsAppFallback={!isSubmitting}
          />
        )}
      </div>
      <div className="lg:col-span-1">
        <BookingSummary
          selectedServices={selectedServices}
          selectedStylist={selectedStylist}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          totalPrice={totalPrice}
          totalDuration={totalDuration}
          onClear={handleReset}
        />
      </div>
    </div>
  );
};

export default BookingForm;

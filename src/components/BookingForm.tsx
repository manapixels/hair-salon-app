import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { SALON_SERVICES } from '@/constants';
import type { Service, TimeSlot, Appointment, Stylist } from '@/types';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/context/AuthContext';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  calculateEndTime,
  formatDuration,
  getDurationColor,
  getDurationPercentage,
} from '@/lib/timeUtils';

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
      {SALON_SERVICES.map(service => (
        <div
          key={service.id}
          onClick={() => onServiceToggle(service)}
          className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${selectedServices.some(s => s.id === service.id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105' : 'bg-white dark:bg-gray-800 hover:shadow-md hover:border-indigo-400 dark:border-gray-700'}`}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-bold">{service.name}</h3>
            <p className="font-semibold text-lg">${service.price}</p>
          </div>
          <p className="text-sm mt-1 opacity-90">{service.description}</p>
          <p className="text-xs mt-2 opacity-70">{service.duration} mins</p>
        </div>
      ))}
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

  useEffect(() => {
    const fetchStylists = async () => {
      if (selectedServices.length === 0) {
        setStylists([]);
        return;
      }

      setLoading(true);
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
        toast.error('Unable to load stylists. Please refresh the page.');
        setStylists([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStylists();
  }, [selectedServices]);

  if (selectedServices.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        2. Choose Your Stylist
      </h2>
      {loading ? (
        <div className="text-center p-4">Loading stylists...</div>
      ) : stylists.length === 0 ? (
        <div className="text-center p-4 text-gray-500">
          No stylists available for the selected services.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {stylists.map(stylist => (
              <div
                key={stylist.id}
                onClick={() => onStylistSelect(stylist)}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedStylist?.id === stylist.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 hover:shadow-md hover:border-indigo-400 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center mb-3">
                  {stylist.avatar ? (
                    <img
                      src={stylist.avatar}
                      alt={stylist.name}
                      className="w-12 h-12 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                      <i className="fas fa-user text-gray-600 dark:text-gray-400"></i>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold">{stylist.name}</h3>
                    <p className="text-sm opacity-80">{stylist.email}</p>
                  </div>
                </div>
                {stylist.bio && <p className="text-sm opacity-90 mb-2">{stylist.bio}</p>}
                <div className="flex flex-wrap gap-1">
                  {stylist.specialties.slice(0, 3).map(service => (
                    <span
                      key={service.id}
                      className={`text-xs px-2 py-1 rounded ${
                        selectedStylist?.id === stylist.id
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {service.name}
                    </span>
                  ))}
                  {stylist.specialties.length > 3 && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        selectedStylist?.id === stylist.id
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      +{stylist.specialties.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => onStylistSelect(null)}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedStylist === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              No Preference
            </button>
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
            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-lg scale-105'
            : isAvailable
              ? 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:shadow-md'
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
            isSelected ? 'bg-indigo-400' : 'bg-gray-200 dark:bg-gray-700'
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
          className={`text-xs ${
            isSelected ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          to {endTime}
        </span>

        {/* Duration label */}
        <div
          className={`flex items-center gap-1 text-xs ${
            isSelected ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-500'
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
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
        3. Select Date & Time
      </h2>

      {/* Date Picker */}
      <div className="mb-6">
        <DatePicker
          selected={selectedDate}
          onChange={date => date && onDateChange(date)}
          inline
          minDate={getTodayInSalonTimezone()}
          calendarClassName="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700 rounded-lg shadow-lg"
          dayClassName={() =>
            'hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg transition-colors'
          }
        />
      </div>

      {/* Time Slots */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Finding available times...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Available Times
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {timeSlots.length} slot{timeSlots.length !== 1 ? 's' : ''} available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
              <div className="col-span-full text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
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
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        4. Confirm Your Booking
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={!!user}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
            required
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={!!user}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-lg shadow-xl text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-all"
          aria-label={isSubmitting ? 'Booking in progress' : 'Confirm your appointment'}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Booking...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Confirm Appointment
            </>
          )}
        </button>

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
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
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
    <div className="p-6 bg-white dark:bg-gray-900/50 rounded-lg shadow-lg sticky top-8">
      <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-gray-700">
        <h3 className="text-xl font-semibold">Booking Summary</h3>
        <button onClick={onClear} className="text-sm text-red-500 hover:underline">
          &times; Clear All
        </button>
      </div>
      {selectedServices.length === 0 ? (
        <p className="text-gray-500">Select services to get started.</p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {selectedServices.map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <span>{s.name}</span>
                <span className="font-medium">${s.price}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 dark:border-gray-700 space-y-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${totalPrice}</span>
            </div>
            <p className="text-xs text-gray-500">Duration: {totalDuration} mins</p>
            {selectedStylist && (
              <p className="text-sm">
                Stylist: <span className="font-medium">{selectedStylist.name}</span>
              </p>
            )}
            {selectedDate && <p className="text-sm">Date: {selectedDate.toLocaleDateString()}</p>}
            {selectedTime && (
              <p className="text-sm font-bold text-indigo-500">Time: {selectedTime}</p>
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

  useEffect(() => {
    setSelectedTime(null);
    setSelectedStylist(null);
  }, [selectedServices, selectedDate]);

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
          <i className="fa-solid fa-check text-4xl text-green-600 dark:text-green-300"></i>
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
            <strong>Date:</strong> {new Date(bookingConfirmed.date).toLocaleDateString()}
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
        <button
          onClick={handleReset}
          className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Make Another Booking
        </button>
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
          <DateTimePicker
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

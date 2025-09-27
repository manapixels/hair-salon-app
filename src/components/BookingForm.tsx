import { useState, useMemo, useEffect } from 'react';
import { SALON_SERVICES } from '@/constants';
import type { Service, TimeSlot, Appointment, Stylist } from '@/types';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/context/AuthContext';

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
        if (response.ok) {
          const availableStylists = await response.json();
          setStylists(availableStylists);
        }
      } catch (error) {
        console.error('Failed to fetch stylists:', error);
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

const DateTimePicker: React.FC<{
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  totalDuration: number;
}> = ({ selectedDate, onDateChange, selectedTime, onTimeSelect, totalDuration }) => {
  const { getAvailableSlots } = useBooking();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      try {
        const availableSlots = await getAvailableSlots(selectedDate);
        const slots = availableSlots.map(slot => ({ time: slot, available: true }));
        setTimeSlots(slots);
      } catch (error) {
        console.error('Failed to fetch time slots:', error);
        setTimeSlots([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate, getAvailableSlots]);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        3. Select Date & Time
      </h2>
      <input
        type="date"
        value={selectedDate.toISOString().split('T')[0]}
        min={new Date().toISOString().split('T')[0]}
        onChange={e => onDateChange(new Date(e.target.value))}
        className="w-full md:w-auto p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 mb-4"
        aria-label="Select a date"
      />
      {loading ? (
        <div className="text-center p-4">Loading time slots...</div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {timeSlots.length > 0 ? (
            timeSlots.map(({ time, available }) => (
              <button
                key={time}
                disabled={!available}
                onClick={() => onTimeSelect(time)}
                className={`p-3 rounded-md text-sm font-medium transition-colors ${selectedTime === time ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : available ? 'bg-gray-200 dark:bg-gray-700 hover:bg-indigo-200 dark:hover:bg-indigo-500' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                aria-pressed={selectedTime === time}
              >
                {time}
              </button>
            ))
          ) : (
            <p className="col-span-full text-gray-500">
              No available slots for this day. Please try another date.
            </p>
          )}
        </div>
      )}
      <p className="text-sm text-gray-500 mt-2">
        Total duration: {totalDuration} minutes. The system will ensure enough consecutive slots are
        free.
      </p>
    </div>
  );
};

const ConfirmationForm: React.FC<{
  onConfirm: (name: string, email: string) => void;
  isSubmitting: boolean;
}> = ({ onConfirm, isSubmitting }) => {
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
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
        </button>
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
  const whatsAppNumber = '15551234567'; // Replace with your salon's WhatsApp Business number
  const message = `Hi! I'd like to book an appointment for ${selectedServices.map(s => s.name).join(' and ')} on ${selectedDate.toLocaleDateString()}. Can you help me find a time?`;
  const whatsappUrl = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(message)}`;

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
          <div className="mt-4 text-center text-xs text-gray-400">or</div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#25D366] hover:bg-[#1EBE57] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <i className="fa-brands fa-whatsapp mr-2 text-xl"></i>
            Book on WhatsApp
          </a>
        </>
      )}
    </div>
  );
};

const BookingForm: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
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
      alert('Please select services, a date, and a time.');
      return;
    }
    setIsSubmitting(true);

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
    } catch (error: any) {
      alert(`Booking failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedServices([]);
    setSelectedStylist(null);
    setSelectedDate(new Date());
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
          />
        )}

        {selectedTime && (
          <ConfirmationForm onConfirm={handleConfirmBooking} isSubmitting={isSubmitting} />
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

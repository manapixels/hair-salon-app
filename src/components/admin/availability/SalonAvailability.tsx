import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { TimeSlot, Appointment, AdminSettings } from '@/types';
import { LoadingSpinner } from '@/components/loaders/LoadingSpinner';

interface SalonAvailabilityProps {
  adminSettings: AdminSettings;
  appointments: Appointment[];
  getAvailableSlots: (date: Date) => Promise<string[]>;
  blockTimeSlot: (date: Date, time: string) => Promise<void>;
  unblockTimeSlot: (date: Date, time: string) => Promise<void>;
}

export default function SalonAvailability({
  adminSettings,
  appointments,
  getAvailableSlots,
  blockTimeSlot,
  unblockTimeSlot,
}: SalonAvailabilityProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAndProcessSlots = async () => {
      setLoading(true);
      const availableSlotsList = await getAvailableSlots(selectedDate);

      // Get day-specific schedule
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const daySchedule = adminSettings?.weeklySchedule?.[
        dayOfWeek as keyof typeof adminSettings.weeklySchedule
      ] || {
        isOpen: true,
        openingTime: '09:00',
        closingTime: '17:00',
      };
      const allSlots = daySchedule.isOpen
        ? generateAllTimeSlots(daySchedule.openingTime, daySchedule.closingTime)
        : [];

      // Validate appointments is an array before filtering
      const apptTimes = Array.isArray(appointments)
        ? appointments
            .filter(a => new Date(a.date).toDateString() === selectedDate.toDateString())
            .map(a => a.time)
        : [];

      const processedSlots = allSlots.map(slot => {
        // availableSlotsList contains slots that are NOT blocked and NOT booked (from backend)
        // If a slot is in availableSlotsList, it's available
        // If not in the list, it means it's blocked or booked
        const isAvailable = availableSlotsList.includes(slot.time);

        return {
          time: slot.time,
          available: isAvailable,
        };
      });
      setTimeSlots(processedSlots);
      setLoading(false);
    };

    fetchAndProcessSlots();
  }, [selectedDate, adminSettings, appointments, getAvailableSlots]);

  const handleTimeSlotClick = async (time: string, isAvailable: boolean) => {
    // Optimistic update
    setTimeSlots(prev =>
      prev.map(slot => (slot.time === time ? { ...slot, available: !isAvailable } : slot)),
    );
    try {
      if (isAvailable) {
        await blockTimeSlot(selectedDate, time);
      } else {
        await unblockTimeSlot(selectedDate, time);
      }
    } catch (error) {
      // Revert on error
      setTimeSlots(prev =>
        prev.map(slot => (slot.time === time ? { ...slot, available: isAvailable } : slot)),
      );
      toast.error('Failed to update slot.');
    }
  };

  const generateAllTimeSlots = (start: string, end: string) => {
    const slots: TimeSlot[] = [];
    let currentTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    while (currentTime < endTime) {
      slots.push({ time: currentTime.toTimeString().substring(0, 5), available: true });
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    return slots;
  };

  return (
    <div className="space-y-[var(--space-6)]">
      <div>
        <h3 className="text-[length:var(--font-size-5)] font-bold text-[var(--gray-12)] mb-[var(--space-2)]">
          Salon-Wide Time Blocking
        </h3>
        <p className="text-[length:var(--font-size-2)] text-[var(--gray-11)]">
          Block or unblock time slots for the entire salon. Blocked slots will not be available for
          booking by any customer.
        </p>
      </div>

      {/* Color Legend */}
      <div className="flex items-center space-x-[var(--space-6)] text-[length:var(--font-size-2)]">
        <div className="flex items-center space-x-[var(--space-2)]">
          <div className="w-4 h-4 rounded-[var(--radius-1)] bg-green-100 dark:bg-green-800 border border-green-300 dark:border-green-700"></div>
          <span className="text-[var(--gray-11)]">Available</span>
        </div>
        <div className="flex items-center space-x-[var(--space-2)]">
          <div className="w-4 h-4 rounded-[var(--radius-1)] bg-gray-300 dark:bg-gray-600 border border-gray-400 dark:border-gray-500"></div>
          <span className="text-[var(--gray-11)]">Blocked</span>
        </div>
        <div className="flex items-center space-x-[var(--space-2)]">
          <div className="w-4 h-4 rounded-[var(--radius-1)] bg-red-500 border border-red-600"></div>
          <span className="text-[var(--gray-11)]">Booked</span>
        </div>
      </div>

      {/* Date Selector */}
      <div>
        <label className="block text-[length:var(--font-size-2)] font-medium text-[var(--gray-12)] mb-[var(--space-2)]">
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={e => setSelectedDate(new Date(e.target.value))}
          className="px-[var(--space-3)] py-[var(--space-2)] border border-[var(--gray-7)] rounded-[var(--radius-2)] text-[length:var(--font-size-2)] bg-[var(--color-surface)] text-[var(--gray-12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] focus-visible:border-[var(--accent-8)] hover:border-[var(--gray-8)] transition-colors"
          aria-label="Select date to manage availability"
        />
      </div>

      {/* Time Slots Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-[var(--space-8)]">
          <LoadingSpinner size="md" message="Loading time slots..." />
        </div>
      ) : timeSlots.length === 0 ? (
        <div className="text-center py-[var(--space-8)] border-2 border-dashed border-[var(--gray-6)] rounded-[var(--radius-3)]">
          <svg
            className="w-12 h-12 text-[var(--gray-9)] mx-auto mb-[var(--space-3)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-[length:var(--font-size-3)] font-medium text-[var(--gray-11)] mb-1">
            Salon is closed on this day
          </p>
          <p className="text-[length:var(--font-size-2)] text-[var(--gray-10)]">
            Update business hours in Settings to make this day available.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3"
          role="group"
          aria-label="Time slot management grid"
        >
          {timeSlots.map(({ time, available }) => {
            const isBooked = appointments.some(
              a =>
                new Date(a.date).toDateString() === selectedDate.toDateString() && a.time === time,
            );
            let buttonClass = '';
            if (isBooked) {
              buttonClass = 'bg-red-500 text-white cursor-not-allowed';
            } else if (available) {
              buttonClass =
                'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-700';
            } else {
              buttonClass =
                'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-500';
            }

            return (
              <button
                key={time}
                onClick={() => !isBooked && handleTimeSlotClick(time, available)}
                disabled={isBooked}
                className={`p-3 rounded-[var(--radius-2)] text-[length:var(--font-size-2)] font-medium transition-colors text-center ${buttonClass}`}
              >
                {time}
                {isBooked && (
                  <span className="block text-[length:var(--font-size-1)] mt-1">Booked</span>
                )}
                {!isBooked &&
                  (available ? (
                    <span className="block text-[length:var(--font-size-1)] mt-1">Available</span>
                  ) : (
                    <span className="block text-[length:var(--font-size-1)] mt-1">Blocked</span>
                  ))}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

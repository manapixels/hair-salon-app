import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { TimeSlot, Appointment, AdminSettings } from '@/types';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';

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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-[2]">Salon-Wide Time Blocking</h3>
        <p className="text-sm text-muted-foreground">
          Block or unblock time slots for the entire salon. Blocked slots will not be available for
          booking by any customer.
        </p>
      </div>

      {/* Color Legend */}
      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-[2]">
          <div className="w-4 h-4 rounded-sm bg-green-100 border border-green-300"></div>
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center space-x-[2]">
          <div className="w-4 h-4 rounded-sm bg-gray-300 border border-gray-400"></div>
          <span className="text-muted-foreground">Blocked</span>
        </div>
        <div className="flex items-center space-x-[2]">
          <div className="w-4 h-4 rounded-sm bg-red-500 border border-red-600"></div>
          <span className="text-muted-foreground">Booked</span>
        </div>
      </div>

      {/* Date Selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-[2]">Select Date</label>
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={e => setSelectedDate(new Date(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-gray-400 transition-colors"
          aria-label="Select date to manage availability"
        />
      </div>

      {/* Time Slots Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner size="md" message="Loading time slots..." />
        </div>
      ) : timeSlots.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-[3]"
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
          <p className="text-[length:var(--font-size-3)] font-medium text-muted-foreground mb-1">
            Salon is closed on this day
          </p>
          <p className="text-sm text-gray-500">
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
              buttonClass = 'bg-green-100 text-green-800 hover:bg-green-200';
            } else {
              buttonClass = 'bg-gray-300 text-gray-500 hover:bg-gray-400';
            }

            return (
              <button
                key={time}
                onClick={() => !isBooked && handleTimeSlotClick(time, available)}
                disabled={isBooked}
                className={`p-3 rounded-md text-sm font-medium transition-colors text-center ${buttonClass}`}
              >
                {time}
                {isBooked && <span className="block text-xs mt-1">Booked</span>}
                {!isBooked &&
                  (available ? (
                    <span className="block text-xs mt-1">Available</span>
                  ) : (
                    <span className="block text-xs mt-1">Blocked</span>
                  ))}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

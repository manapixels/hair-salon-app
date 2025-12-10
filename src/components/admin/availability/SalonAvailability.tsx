import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { TimeSlot, Appointment, AdminSettings } from '@/types';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white border border-border rounded-xl p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Salon-Wide Time Blocking
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Block or unblock time slots for the entire salon.
            </p>
          </div>

          {/* Legend - Inline on desktop */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></div>
              <span className="text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-400 ring-2 ring-gray-200"></div>
              <span className="text-muted-foreground">Blocked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-200"></div>
              <span className="text-muted-foreground">Booked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="flex items-center justify-between gap-2">
          {/* Previous Day */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate(-1)}
            className="shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Date Display & Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Button
              variant={isToday ? 'default' : 'outline'}
              size="sm"
              onClick={goToToday}
              className="text-xs"
            >
              Today
            </Button>
            <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={e => setSelectedDate(new Date(e.target.value))}
                className="bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer"
                aria-label="Select date"
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              {formatDate(selectedDate)}
            </span>
          </div>

          {/* Next Day */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate(1)}
            className="shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Time Slots Grid */}
      <div className="bg-white border border-border rounded-xl p-4 lg:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" message="Loading time slots..." />
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/30">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-base font-medium text-muted-foreground mb-1">
              Salon is closed on this day
            </p>
            <p className="text-sm text-muted-foreground">
              Update business hours in Settings to make this day available.
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 lg:gap-3"
            role="group"
            aria-label="Time slot management grid"
          >
            {timeSlots.map(({ time, available }) => {
              const isBooked = appointments.some(
                a =>
                  new Date(a.date).toDateString() === selectedDate.toDateString() &&
                  a.time === time,
              );

              // Determine styling
              let cardClasses =
                'relative p-3 lg:p-4 rounded-xl text-center transition-all duration-200 min-h-[72px] flex flex-col items-center justify-center ';
              let statusClasses = 'text-[10px] lg:text-xs font-medium mt-0.5 ';

              if (isBooked) {
                cardClasses +=
                  'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 cursor-not-allowed';
                statusClasses += 'text-amber-700';
              } else if (available) {
                cardClasses +=
                  'bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-200 cursor-pointer active:scale-95';
                statusClasses += 'text-emerald-700';
              } else {
                cardClasses +=
                  'bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 hover:border-gray-500 hover:ring-2 hover:ring-gray-200 cursor-pointer active:scale-95';
                statusClasses += 'text-gray-600';
              }

              return (
                <button
                  key={time}
                  onClick={() => !isBooked && handleTimeSlotClick(time, available)}
                  disabled={isBooked}
                  className={cardClasses}
                >
                  <span className="text-sm lg:text-base font-semibold text-foreground">{time}</span>
                  <span className={statusClasses}>
                    {isBooked ? 'Booked' : available ? 'Available' : 'Blocked'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

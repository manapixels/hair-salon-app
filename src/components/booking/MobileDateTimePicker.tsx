import { useState, useRef, useEffect } from 'react';
import { format, addDays, isSameDay, startOfDay, eachDayOfInterval } from 'date-fns';
import { ChevronRight, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { CalendarView } from './CalendarView';
import { TimeSlotList } from './TimeSlotList';
import type { TimeSlot, Stylist } from '@/types';
import { groupSlotsByPeriod } from '@/lib/timeUtils';

interface MobileDateTimePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedTime: string | null;
  onTimeSelect: (time: string | null) => void;
  timeSlots: TimeSlot[];
  loading?: boolean;
  minDate?: Date;
  // Calendar props
  currentMonth: Date;
  daysInMonth: Date[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function MobileDateTimePicker({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeSelect,
  timeSlots,
  loading = false,
  minDate = new Date(),
  currentMonth,
  daysInMonth,
  onPreviousMonth,
  onNextMonth,
}: MobileDateTimePickerProps) {
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const dateScrollRef = useRef<HTMLDivElement>(null);

  // Generate dates for the horizontal scroll (next 30 days)
  // If selectedDate is far in the future, ensure it's included or the range starts near it?
  // For simplicity, we'll show 60 days from today.
  // If selectedDate is outside this range, we might want to adjust, but let's stick to a fixed range for now
  // or dynamic based on selectedDate if it's far.
  const today = startOfDay(new Date());
  const startDate = today;
  const endDate = addDays(today, 60);

  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  // Scroll to selected date on mount or change
  useEffect(() => {
    if (dateScrollRef.current && !isCalendarExpanded) {
      const selectedButton = dateScrollRef.current.querySelector('[data-selected="true"]');
      if (selectedButton) {
        selectedButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedDate, isCalendarExpanded]);

  const handleDateClick = (date: Date) => {
    onDateChange(date);
    // If calendar is open, close it? Or keep it?
    // User requested "expands into calendar", implies it can be collapsed.
    // Usually picking a date closes the picker.
    setIsCalendarExpanded(false);
  };

  // Group time slots
  const groupedSlots = groupSlotsByPeriod(timeSlots);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date Selection Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(selectedDate, 'MMMM')}
          </h3>
          <button
            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            {isCalendarExpanded ? 'Less dates' : 'More dates'}
            {isCalendarExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {isCalendarExpanded ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-in slide-in-from-top-2">
            <CalendarView
              selectedDate={selectedDate}
              onDateChange={handleDateClick}
              minDate={minDate}
              loading={false}
              currentMonth={currentMonth}
              daysInMonth={daysInMonth}
              onPreviousMonth={onPreviousMonth}
              onNextMonth={onNextMonth}
            />
          </div>
        ) : (
          <div
            ref={dateScrollRef}
            className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x"
          >
            {dates.map(date => {
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  data-selected={isSelected}
                  className={`
                    flex flex-col items-center justify-center min-w-[4.5rem] h-20 rounded-2xl border transition-all snap-center
                    ${
                      isSelected
                        ? 'bg-primary border-primary text-white shadow-md scale-105'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <span
                    className={`text-xs font-medium mb-1 ${isSelected ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    {format(date, 'EEE')}
                  </span>
                  <span
                    className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                  >
                    {format(date, 'dd')}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Time Selection Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Times</h3>
          {loading && <span className="text-xs text-gray-500">Loading...</span>}
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="min-w-[100px] h-12 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse"
              />
            ))}
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No slots available for this date</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Morning */}
            {groupedSlots.morning.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Morning
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {groupedSlots.morning.map(slot => (
                    <TimeChip
                      key={slot.time}
                      slot={slot}
                      selectedTime={selectedTime}
                      onSelect={onTimeSelect}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Afternoon */}
            {groupedSlots.afternoon.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Afternoon
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {groupedSlots.afternoon.map(slot => (
                    <TimeChip
                      key={slot.time}
                      slot={slot}
                      selectedTime={selectedTime}
                      onSelect={onTimeSelect}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Evening */}
            {groupedSlots.evening.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Evening
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {groupedSlots.evening.map(slot => (
                    <TimeChip
                      key={slot.time}
                      slot={slot}
                      selectedTime={selectedTime}
                      onSelect={onTimeSelect}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TimeChip({
  slot,
  selectedTime,
  onSelect,
}: {
  slot: TimeSlot;
  selectedTime: string | null;
  onSelect: (time: string) => void;
}) {
  const isSelected = selectedTime === slot.time;

  return (
    <button
      onClick={() => onSelect(slot.time)}
      disabled={!slot.available}
      className={`
        flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all
        ${
          isSelected
            ? 'bg-primary text-black shadow-md scale-105 ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
        ${!slot.available && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900 text-gray-400'}
      `}
    >
      {slot.time}
    </button>
  );
}

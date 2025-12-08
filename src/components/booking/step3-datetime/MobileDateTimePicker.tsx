'use client';

import { useState, useRef, useEffect } from 'react';
import { format, addDays, isSameDay, startOfDay, eachDayOfInterval } from 'date-fns';
import { ChevronRight, ChevronDown, Check } from 'lucide-react';
import { CalendarView } from './CalendarView';
import type { TimeSlot } from '@/types';
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
  isAnimatingSelection?: boolean;
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
  isAnimatingSelection = false,
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
    <div className="space-y-6 animate-fade-in px-4">
      {/* Date Selection Section */}
      <div className="space-y-3 overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{format(selectedDate, 'MMMM')}</h3>
          <button
            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
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
          <div className="bg-white rounded-xl border border-gray-200 p-4 animate-in slide-in-from-top-2">
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
            className="flex gap-3 overflow-x-auto py-2 -mx-4 px-4 scrollbar-hide snap-x"
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
                    relative flex flex-col items-center justify-center min-w-[4.5rem] h-20 rounded-2xl border transition-all snap-center
                    hover:border-primary focus:ring-2 focus:ring-primary/20
                    ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }
                    ${isSelected && isAnimatingSelection ? 'animate-pulse-selection motion-reduce:animate-none' : ''}
                  `}
                >
                  {/* Checkmark */}
                  {isSelected && (
                    <div
                      className={`absolute -right-1 -top-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary ${isAnimatingSelection ? 'animate-scale-in' : ''}`}
                      aria-hidden="true"
                    >
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <span
                    className={`text-xs font-medium mb-1 ${isSelected ? 'text-primary/70' : 'text-gray-500'}`}
                  >
                    {format(date, 'EEE')}
                  </span>
                  <span
                    className={`text-xl font-bold ${isSelected ? 'text-primary' : 'text-gray-900'}`}
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
          <h3 className="text-lg font-semibold text-gray-900">Available Times</h3>
          {loading && <span className="text-xs text-gray-500">Loading...</span>}
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="min-w-[100px] h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-gray-500">No slots available for this date</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Morning */}
            {groupedSlots.morning.length > 0 && (
              <div className="space-y-3 overflow-x-hidden">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Morning
                </h4>
                <div className="flex gap-3 overflow-x-auto py-2 -mx-4 px-4 scrollbar-hide">
                  {groupedSlots.morning.map(slot => (
                    <TimeChip
                      key={slot.time}
                      slot={slot}
                      selectedTime={selectedTime}
                      onSelect={onTimeSelect}
                      isAnimatingSelection={isAnimatingSelection}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Afternoon */}
            {groupedSlots.afternoon.length > 0 && (
              <div className="space-y-3 overflow-x-hidden">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Afternoon
                </h4>
                <div className="flex gap-3 overflow-x-auto py-2 -mx-4 px-4 scrollbar-hide">
                  {groupedSlots.afternoon.map(slot => (
                    <TimeChip
                      key={slot.time}
                      slot={slot}
                      selectedTime={selectedTime}
                      onSelect={onTimeSelect}
                      isAnimatingSelection={isAnimatingSelection}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Evening */}
            {groupedSlots.evening.length > 0 && (
              <div className="space-y-3 overflow-x-hidden">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Evening
                </h4>
                <div className="flex gap-3 overflow-x-auto py-2 -mx-4 px-4 scrollbar-hide">
                  {groupedSlots.evening.map(slot => (
                    <TimeChip
                      key={slot.time}
                      slot={slot}
                      selectedTime={selectedTime}
                      onSelect={onTimeSelect}
                      isAnimatingSelection={isAnimatingSelection}
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
  isAnimatingSelection = false,
}: {
  slot: TimeSlot;
  selectedTime: string | null;
  onSelect: (time: string) => void;
  isAnimatingSelection?: boolean;
}) {
  const isSelected = selectedTime === slot.time;

  return (
    <button
      onClick={() => onSelect(slot.time)}
      disabled={!slot.available}
      className={`
        relative flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all
        hover:border-primary focus:ring-2 focus:ring-primary/20
        ${
          isSelected
            ? 'border-primary bg-primary/5 text-primary border pr-8'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        }
        ${!slot.available && 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400'}
        ${isSelected && isAnimatingSelection ? 'animate-pulse-selection motion-reduce:animate-none' : ''}
      `}
    >
      {slot.time}
      {/* Checkmark */}
      {isSelected && (
        <div
          className={`absolute -right-1 -top-1 flex items-center justify-center w-4 h-4 rounded-full bg-primary ${isAnimatingSelection ? 'animate-scale-in' : ''}`}
          aria-hidden="true"
        >
          <Check className="h-2.5 w-2.5 text-white" />
        </div>
      )}
    </button>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { isSameDay, startOfDay, eachDayOfInterval, addDays } from 'date-fns';
import { ChevronRight, ChevronDown, Check } from 'lucide-react';
import { CalendarView } from './CalendarView';
import type { TimeSlot } from '@/types';
import { groupSlotsByPeriod } from '@/lib/timeUtils';
import { useTranslations, useFormatter } from 'next-intl';
import { getTodayInSalonTimezone } from '@/components/booking/shared';

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
  minDate,
  currentMonth,
  daysInMonth,
  onPreviousMonth,
  onNextMonth,
  isAnimatingSelection = false,
}: MobileDateTimePickerProps) {
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const dateScrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('BookingForm');
  const format = useFormatter();

  // Generate dates for the horizontal scroll - use salon timezone for "today"
  // Use useState + useEffect to ensure this runs ONLY on client (not during SSR)
  const [dateState, setDateState] = useState<{
    dates: Date[];
    today: Date;
    effectiveMinDate: Date;
  } | null>(null);

  useEffect(() => {
    // This runs only on client after hydration
    const salonToday = getTodayInSalonTimezone();
    const todayStart = startOfDay(salonToday);
    const minDateVal = minDate ?? todayStart;
    const endDate = addDays(todayStart, 60);
    setDateState({
      dates: eachDayOfInterval({ start: todayStart, end: endDate }),
      today: todayStart,
      effectiveMinDate: minDateVal,
    });
  }, [minDate]);

  // Fallback for SSR/initial render - use selectedDate as starting point
  const dates = dateState?.dates ?? [selectedDate];
  const today = dateState?.today ?? selectedDate;
  const effectiveMinDate = dateState?.effectiveMinDate ?? selectedDate;

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
    setIsCalendarExpanded(false);
  };

  // Group time slots
  const groupedSlots = groupSlotsByPeriod(timeSlots);

  // Render helper for different layouts
  const renderTimeSlots = () => {
    return (
      <div className="space-y-6">
        {groupedSlots.morning.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {t('morning')}
            </h4>
            <div className={`grid grid-cols-3 gap-2`}>
              {groupedSlots.morning.map(slot => (
                <TimeChip
                  key={slot.time}
                  slot={slot}
                  selectedTime={selectedTime}
                  onSelect={onTimeSelect}
                  isAnimatingSelection={isAnimatingSelection}
                  variant={'grid'}
                />
              ))}
            </div>
          </div>
        )}
        {groupedSlots.afternoon.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {t('afternoon')}
            </h4>
            <div className={`grid grid-cols-3 gap-2`}>
              {groupedSlots.afternoon.map(slot => (
                <TimeChip
                  key={slot.time}
                  slot={slot}
                  selectedTime={selectedTime}
                  onSelect={onTimeSelect}
                  isAnimatingSelection={isAnimatingSelection}
                  variant={'grid'}
                />
              ))}
            </div>
          </div>
        )}
        {groupedSlots.evening.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {t('evening')}
            </h4>
            <div className={`grid grid-cols-3 gap-2`}>
              {groupedSlots.evening.map(slot => (
                <TimeChip
                  key={slot.time}
                  slot={slot}
                  selectedTime={selectedTime}
                  onSelect={onTimeSelect}
                  isAnimatingSelection={isAnimatingSelection}
                  variant={'grid'}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in px-4">
      {/* Date Selection Section */}
      <div className="space-y-3 overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {format.dateTime(selectedDate, { month: 'long' })}
          </h3>
          <button
            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            {isCalendarExpanded ? t('lessDates') : t('moreDates')}
            {isCalendarExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {isCalendarExpanded ? (
          <div className="bg-white animate-in slide-in-from-top-2">
            <CalendarView
              selectedDate={selectedDate}
              onDateChange={handleDateClick}
              minDate={effectiveMinDate}
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
                    {format.dateTime(date, { weekday: 'short' })}
                  </span>
                  <span
                    className={`text-xl font-bold ${isSelected ? 'text-primary' : 'text-gray-900'}`}
                  >
                    {format.dateTime(date, { day: '2-digit' })}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Time Selection Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t('availableTimes')}</h3>
            {loading && <span className="text-xs text-gray-500">{t('loading')}</span>}
          </div>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="min-w-[100px] h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-gray-500">{t('noSlotsForDate')}</p>
          </div>
        ) : (
          renderTimeSlots()
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
  variant = 'horizontal',
}: {
  slot: TimeSlot;
  selectedTime: string | null;
  onSelect: (time: string) => void;
  isAnimatingSelection?: boolean;
  variant?: 'horizontal' | 'grid' | 'list';
}) {
  const isSelected = selectedTime === slot.time;

  return (
    <button
      onClick={() => onSelect(slot.time)}
      disabled={!slot.available}
      className={`
        relative rounded-xl text-sm font-medium transition-all
        hover:border-primary focus:ring-2 focus:ring-primary/20
        ${
          variant === 'horizontal'
            ? 'flex-shrink-0 px-5 py-2.5 min-w-[5.5rem] flex items-center justify-center'
            : variant === 'list'
              ? 'w-full px-4 py-3 flex items-center justify-between'
              : 'w-full px-1 py-2.5 flex items-center justify-center' /* grid */
        }
        ${
          isSelected
            ? 'border-primary bg-primary/5 text-primary border'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        }
        ${!slot.available && 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400'}
        ${isSelected && isAnimatingSelection ? 'animate-pulse-selection motion-reduce:animate-none' : ''}
      `}
    >
      {slot.time}
      {/* Checkmark - Position varies by layout */}
      {isSelected && (
        <div
          className={`
            absolute flex items-center justify-center w-4 h-4 rounded-full bg-primary
            ${variant === 'list' ? 'relative ml-2' : '-right-1 -top-1'}
            ${isAnimatingSelection ? 'animate-scale-in' : ''}
          `}
          aria-hidden="true"
        >
          <Check className="h-2.5 w-2.5 text-white" />
        </div>
      )}
    </button>
  );
}

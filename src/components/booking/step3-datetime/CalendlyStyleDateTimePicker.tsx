'use client';

import { useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarView } from './CalendarView';
import { TimeSlotList } from './TimeSlotList';
import { MobileDateTimePicker } from './MobileDateTimePicker';
import { useCalendar } from '@/hooks/useCalendar';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useAvailability } from '@/hooks/queries';
import type { TimeSlot, Stylist } from '@/types';

interface CalendlyStyleDateTimePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedTime: string | null;
  onTimeSelect: (time: string | null) => void;
  totalDuration: number;
  selectedStylist: Stylist | null;
  isAnimatingSelection?: boolean; // Pulse animation when time slot is selected
}

export default function CalendlyStyleDateTimePicker({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeSelect,
  totalDuration,
  selectedStylist,
  isAnimatingSelection = false,
}: CalendlyStyleDateTimePickerProps) {
  const { currentMonth, daysInMonth, goToPreviousMonth, goToNextMonth } = useCalendar(selectedDate);
  const timeSlotsRef = useRef<HTMLDivElement>(null);

  // Use React Query hook for availability with 1-minute cache
  const { data: availabilityData = [], isLoading } = useAvailability({
    date: selectedDate,
    stylistId: selectedStylist?.id,
    duration: totalDuration,
  });

  // Convert availability data to TimeSlot format
  const timeSlots = useMemo<TimeSlot[]>(
    () => availabilityData.map(time => ({ time, available: true })),
    [availabilityData],
  );

  const showLoader = useDelayedLoading(isLoading, { delay: 150, minDuration: 300 });

  const handleDateChange = (date: Date) => {
    onDateChange(date);
    onTimeSelect(null); // Reset time selection when date changes

    // Scroll to time slots on mobile
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        timeSlotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <div id="date-time-picker">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">3. Select Date & Time</h2>

      {/* ARIA Live Region for Screen Readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {showLoader && 'Loading available time slots'}
        {!showLoader &&
          timeSlots.length === 0 &&
          `No available slots on ${format(selectedDate, 'MMMM d, yyyy')}`}
        {!showLoader &&
          timeSlots.length > 0 &&
          `${timeSlots.length} time slots available on ${format(selectedDate, 'MMMM d, yyyy')}`}
        {selectedTime && `Time slot ${selectedTime} selected`}
      </div>

      <div className="block lg:hidden">
        <MobileDateTimePicker
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          selectedTime={selectedTime}
          onTimeSelect={onTimeSelect}
          timeSlots={timeSlots}
          loading={showLoader}
          minDate={new Date()}
          currentMonth={currentMonth}
          daysInMonth={daysInMonth}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          isAnimatingSelection={isAnimatingSelection}
        />
      </div>

      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column: Calendar */}
        <div className="flex flex-col">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Choose a Date</h3>
          <CalendarView
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            currentMonth={currentMonth}
            daysInMonth={daysInMonth}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
            minDate={new Date()}
            loading={false}
          />
        </div>

        {/* Right Column: Time Slots */}
        <div className="flex flex-col" ref={timeSlotsRef}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Available Times</h3>
            <span className="text-sm text-gray-500">{format(selectedDate, 'EEEE, MMM d')}</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            <TimeSlotList
              slots={timeSlots}
              selectedTime={selectedTime}
              onTimeSelect={onTimeSelect}
              loading={showLoader}
              isAnimatingSelection={isAnimatingSelection}
            />
          </div>

          {/* Keyboard Hints */}
          {timeSlots.length > 0 && !showLoader && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              Use Tab to navigate, Enter to select
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

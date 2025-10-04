'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CalendarView } from './CalendarView';
import { TimeSlotList } from './TimeSlotList';
import { useCalendar } from '@/hooks/useCalendar';
import type { TimeSlot, Stylist } from '@/types';

interface CalendlyStyleDateTimePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedTime: string | null;
  onTimeSelect: (time: string | null) => void;
  totalDuration: number;
  selectedStylist: Stylist | null;
}

export default function CalendlyStyleDateTimePicker({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeSelect,
  totalDuration,
  selectedStylist,
}: CalendlyStyleDateTimePickerProps) {
  const { currentMonth, daysInMonth, goToPreviousMonth, goToNextMonth } = useCalendar(selectedDate);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch time slots when date or stylist changes
  const fetchTimeSlots = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const stylistParam = selectedStylist?.id ? `&stylistId=${selectedStylist.id}` : '';
      const durationParam = totalDuration ? `&duration=${totalDuration}` : '';

      const response = await fetch(
        `/api/availability?date=${dateStr}${stylistParam}${durationParam}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch available time slots');
      }

      const data = await response.json();
      const slots: TimeSlot[] = data.map((time: string) => ({
        time,
        available: true,
      }));

      setTimeSlots(slots);
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
      toast.error('Unable to load available times. Please try another date.');
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedStylist, totalDuration]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  const handleDateChange = (date: Date) => {
    onDateChange(date);
    onTimeSelect(null); // Reset time selection when date changes
  };

  return (
    <div className="mt-8" id="date-time-picker">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
        3. Select Date & Time
      </h2>

      {/* ARIA Live Region for Screen Readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {loading && 'Loading available time slots'}
        {!loading &&
          timeSlots.length === 0 &&
          `No available slots on ${format(selectedDate, 'MMMM d, yyyy')}`}
        {!loading &&
          timeSlots.length > 0 &&
          `${timeSlots.length} time slots available on ${format(selectedDate, 'MMMM d, yyyy')}`}
        {selectedTime && `Time slot ${selectedTime} selected`}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column: Calendar */}
        <div className="flex flex-col">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Choose a Date
          </h3>
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
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Available Times
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {format(selectedDate, 'EEEE, MMM d')}
            </span>
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            <TimeSlotList
              slots={timeSlots}
              selectedTime={selectedTime}
              onTimeSelect={onTimeSelect}
              loading={loading}
            />
          </div>

          {/* Keyboard Hints */}
          {timeSlots.length > 0 && !loading && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-3 text-center">
              Use Tab to navigate, Enter to select
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

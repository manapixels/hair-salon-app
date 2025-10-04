'use client';

import { useMemo, useCallback, KeyboardEvent } from 'react';
import {
  format,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  isSameMonth,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  currentMonth: Date;
  daysInMonth: Date[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  availableDates?: Set<string>;
  minDate: Date;
  maxDate?: Date;
  loading?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onDateChange,
  currentMonth,
  daysInMonth,
  onPreviousMonth,
  onNextMonth,
  availableDates,
  minDate,
  maxDate,
  loading = false,
}) => {
  const isDateAvailable = (date: Date) => {
    if (!availableDates) return true;
    const dateKey = format(date, 'yyyy-MM-dd');
    return availableDates.has(dateKey);
  };

  const isDateDisabled = (date: Date) => {
    if (isBefore(startOfDay(date), startOfDay(minDate))) return true;
    if (maxDate && isBefore(startOfDay(maxDate), startOfDay(date))) return true;
    return false;
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, date: Date) => {
      let newDate = date;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          newDate = addDays(date, 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newDate = subDays(date, 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newDate = addWeeks(date, 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newDate = subWeeks(date, 1);
          break;
        case 'Home':
          e.preventDefault();
          newDate = startOfWeek(date);
          break;
        case 'End':
          e.preventDefault();
          newDate = endOfWeek(date);
          break;
        case 'PageDown':
          e.preventDefault();
          onNextMonth();
          return;
        case 'PageUp':
          e.preventDefault();
          onPreviousMonth();
          return;
        default:
          return;
      }

      if (!isDateDisabled(newDate)) {
        onDateChange(newDate);
      }
    },
    [onDateChange, onNextMonth, onPreviousMonth, isDateDisabled],
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6 px-2">
        <button
          onClick={onPreviousMonth}
          className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>

        <button
          onClick={onNextMonth}
          className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center py-2 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Date Grid */}
      <div className="grid grid-cols-7 gap-1" role="grid">
        {daysInMonth.map(date => {
          const isSelected = isSameDay(date, selectedDate);
          const isAvailable = isDateAvailable(date);
          const isDisabled = isDateDisabled(date);
          const isTodayDate = isToday(date);
          const isCurrentMonth = isSameMonth(date, currentMonth);

          return (
            <button
              key={date.toISOString()}
              role="gridcell"
              aria-label={
                format(date, 'MMMM d, yyyy') + (isAvailable ? ', Available' : ', Unavailable')
              }
              aria-selected={isSelected}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              onClick={() => !isDisabled && onDateChange(date)}
              onKeyDown={e => handleKeyDown(e, date)}
              tabIndex={isSelected ? 0 : -1}
              className={`
                h-10 w-full rounded-lg flex items-center justify-center text-sm font-medium relative transition-all
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                ${isSelected ? 'bg-indigo-600 text-white font-semibold' : ''}
                ${!isSelected && isTodayDate ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}
                ${!isSelected && !isDisabled && isCurrentMonth ? 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer' : ''}
                ${isDisabled || !isCurrentMonth ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' : ''}
                ${!isDisabled && !isSelected && isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : ''}
              `}
            >
              {format(date, 'd')}
              {isAvailable && !isSelected && isCurrentMonth && !isDisabled && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600"></div>
        </div>
      )}
    </div>
  );
};

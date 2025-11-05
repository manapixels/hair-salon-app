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
import { LoadingSpinner } from '../loaders/LoadingSpinner';

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

  const isDateDisabled = useCallback(
    (date: Date) => {
      if (isBefore(startOfDay(date), startOfDay(minDate))) return true;
      if (maxDate && isBefore(startOfDay(maxDate), startOfDay(date))) return true;
      return false;
    },
    [minDate, maxDate],
  );

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
    <div className="bg-[var(--color-panel-solid)] rounded-[var(--radius-4)] border border-[var(--gray-6)] p-[var(--space-5)] sm:p-[var(--space-6)]">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-[var(--space-5)] px-[var(--space-2)]">
        <button
          onClick={onPreviousMonth}
          disabled={loading}
          className="w-10 h-10 rounded-[var(--radius-3)] hover:bg-[var(--gray-3)] flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5 text-[var(--gray-11)]"
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

        <div className="flex items-center gap-[var(--space-2)]">
          <h2 className="text-[length:var(--font-size-4)] font-semibold text-[var(--gray-12)]">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          {loading && <LoadingSpinner size="sm" className="text-accent" />}
        </div>

        <button
          onClick={onNextMonth}
          disabled={loading}
          className="w-10 h-10 rounded-[var(--radius-3)] hover:bg-[var(--gray-3)] flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5 text-[var(--gray-11)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1 mb-[var(--space-2)]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-[length:var(--font-size-1)] font-medium text-[var(--gray-11)] text-center py-[var(--space-2)] uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Date Grid */}
      <div
        className={`grid grid-cols-7 gap-1 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}
        role="grid"
        aria-busy={loading}
      >
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
                h-10 w-full rounded-[var(--radius-2)] flex items-center justify-center text-[length:var(--font-size-2)] font-medium relative transition-all
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]
                ${isSelected ? 'bg-accent font-semibold' : ''}
                ${!isSelected && isTodayDate ? 'ring-2 ring-[var(--accent-8)] ring-offset-2 ring-offset-[var(--color-panel-solid)]' : ''}
                ${!isSelected && !isDisabled && isCurrentMonth ? 'hover:bg-[var(--accent-4)] cursor-pointer' : ''}
                ${isDisabled || !isCurrentMonth ? 'text-[var(--gray-8)] cursor-not-allowed' : ''}
                ${!isDisabled && !isSelected && isCurrentMonth ? 'text-[var(--gray-12)]' : ''}
              `}
            >
              {format(date, 'd')}
              {isAvailable && !isSelected && isCurrentMonth && !isDisabled && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Screen reader announcement */}
      {loading && (
        <div className="sr-only" role="status" aria-live="polite">
          Loading available dates...
        </div>
      )}
    </div>
  );
};

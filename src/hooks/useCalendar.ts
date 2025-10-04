/**
 * Custom hook for calendar state management
 */

import { useState, useMemo, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

interface UseCalendarReturn {
  currentMonth: Date;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  daysInMonth: Date[];
}

export const useCalendar = (initialDate: Date = new Date()): UseCalendarReturn => {
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  // Calculate all days to display in calendar grid (including padding days)
  const daysInMonth = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prev => subMonths(prev, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => addMonths(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  }, []);

  return {
    currentMonth,
    selectedDate,
    setSelectedDate,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    daysInMonth,
  };
};

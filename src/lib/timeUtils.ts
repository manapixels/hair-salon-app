/**
 * Time utility functions for appointment booking
 */

import { format } from 'date-fns';

/**
 * Calculate the end time given a start time and duration
 * @param startTime - Time string in format "9:00 AM" or "2:30 PM"
 * @param durationMinutes - Duration in minutes
 * @returns End time in format "12:30 PM"
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  // Parse "9:00 AM" or "2:30 PM" format
  const [time, period] = startTime.split(' ');
  const [hours, minutes] = time.split(':').map(Number);

  // Convert to 24-hour format
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) {
    hour24 += 12;
  }
  if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }

  // Add duration
  const totalMinutes = hour24 * 60 + minutes + durationMinutes;
  const endHour24 = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;

  // Convert back to 12-hour format
  const endPeriod = endHour24 >= 12 ? 'PM' : 'AM';
  const endHour12 = endHour24 % 12 || 12;

  return `${endHour12}:${endMinutes.toString().padStart(2, '0')} ${endPeriod}`;
}

/**
 * Format a time range with start and end times
 * @param startTime - Start time in format "9:00 AM"
 * @param durationMinutes - Duration in minutes
 * @returns Formatted range like "9:00 AM - 12:30 PM"
 */
export function formatTimeRange(startTime: string, durationMinutes: number): string {
  const endTime = calculateEndTime(startTime, durationMinutes);
  return `${startTime} - ${endTime}`;
}

/**
 * Get duration parts for use with i18n translation keys
 * @param minutes - Duration in minutes
 * @returns Object with hours and minutes for translation interpolation
 */
export function getDurationParts(minutes: number): { hours: number; mins: number } {
  return {
    hours: Math.floor(minutes / 60),
    mins: minutes % 60,
  };
}

/**
 * Format duration in human-readable format
 * @param minutes - Duration in minutes
 * @returns Formatted string like "2h 30m", "45m", or "1h"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Convert 24-hour time format to 12-hour format with lowercase am/pm
 * @param time - Time string in HH:MM format (e.g., "15:00", "09:30")
 * @returns Time in 12-hour format with lowercase am/pm (e.g., "3pm", "9:30am")
 */
export function formatTime12Hour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);

  // Determine AM/PM
  const period = hours >= 12 ? 'pm' : 'am';

  // Convert to 12-hour format (0-23 -> 1-12)
  const hour12 = hours % 12 || 12;

  // Format: if minutes are 00, show just the hour (e.g., "3pm"), otherwise include minutes (e.g., "3:30pm")
  if (minutes === 0) {
    return `${hour12}${period}`;
  }
  return `${hour12}:${minutes.toString().padStart(2, '0')}${period}`;
}

/**
 * Get color class for duration indicator based on length
 * @param minutes - Duration in minutes
 * @returns Tailwind color class
 */
export function getDurationColor(minutes: number): string {
  if (minutes <= 60) return 'bg-green-500';
  if (minutes <= 120) return 'bg-yellow-500';
  if (minutes <= 180) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Get percentage for visual duration bar (0-100)
 * @param minutes - Duration in minutes
 * @returns Percentage value for width (0-100)
 */
export function getDurationPercentage(minutes: number): number {
  const max = 240; // 4 hours max for visual scaling
  return Math.min((minutes / max) * 100, 100);
}

/**
 * Group time slots by period of day
 * @param slots - Array of time slot objects
 * @returns Object with morning, afternoon, and evening arrays
 */
export function groupSlotsByPeriod<T extends { time: string }>(
  slots: T[],
): {
  morning: T[];
  afternoon: T[];
  evening: T[];
} {
  return slots.reduce(
    (acc, slot) => {
      const [time, period] = slot.time.split(' ');
      const hour = parseInt(time.split(':')[0]);

      // Convert to 24-hour for comparison
      let hour24 = hour;
      if (period === 'PM' && hour !== 12) hour24 += 12;
      if (period === 'AM' && hour === 12) hour24 = 0;

      if (hour24 < 12) {
        acc.morning.push(slot);
      } else if (hour24 < 17) {
        acc.afternoon.push(slot);
      } else {
        acc.evening.push(slot);
      }
      return acc;
    },
    { morning: [] as T[], afternoon: [] as T[], evening: [] as T[] },
  );
}

/**
 * Format a date in the universal "18 Oct 2025" format
 * For locale-aware formatting, use next-intl's useFormatter hook in components
 * @param date - Date object or string to format
 * @returns Formatted date string like "18 Oct 2025"
 */
export function formatDisplayDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Validate date
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date provided to formatDisplayDate:', date);
    return 'Invalid Date';
  }

  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const year = dateObj.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format a date in long format with day of week
 * For locale-aware formatting, use next-intl's useFormatter hook in components
 * @param date - Date object or string to format
 * @returns Formatted date string like "Monday, 18 Oct 2025"
 */
export function formatLongDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Validate date
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date provided to formatLongDate:', date);
    return 'Invalid Date';
  }

  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const year = dateObj.getFullYear();

  return `${dayOfWeek}, ${day} ${month} ${year}`;
}

/**
 * Format a date in short format with day of week
 * For locale-aware formatting, use next-intl's useFormatter hook in components
 * @param date - Date object or string to format
 * @returns Formatted date string like "Mon, 18 Oct 2025"
 */
export function formatShortDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Validate date
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date provided to formatShortDate:', date);
    return 'Invalid Date';
  }

  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const year = dateObj.getFullYear();

  return `${dayOfWeek}, ${day} ${month} ${year}`;
}

/**
 * Format time for display (e.g., "3:30 pm")
 * For locale-aware formatting, use next-intl's useFormatter hook in components
 * @param time - Time string in HH:MM format
 * @returns Formatted time string
 */
export const formatTimeDisplay = (time: string): string => {
  // Guard against null, undefined, or empty string
  if (!time || time.trim() === '') {
    return '';
  }

  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));

  // Guard against invalid date
  if (isNaN(date.getTime())) {
    return '';
  }

  return format(date, 'h:mm a').toLowerCase();
};

// =============================================================================
// TIMEZONE UTILITIES FOR UTC/LOCAL CONVERSION
// =============================================================================

/**
 * Convert a local Date object to UTC ISO string for database storage
 * @param localDate - Date object in user's local timezone
 * @returns ISO string in UTC (e.g., "2024-03-15T14:30:00.000Z")
 */
export function toUTC(localDate: Date): string {
  return localDate.toISOString();
}

/**
 * Convert UTC ISO string from database to local Date object
 * @param utcString - ISO string in UTC (e.g., "2024-03-15T14:30:00.000Z")
 * @returns Date object in user's local timezone
 */
export function toLocalDate(utcString: string): Date {
  return new Date(utcString);
}

/**
 * Compare two dates ignoring time, timezone-safe
 * @param date1 - First date (Date object or UTC string)
 * @param date2 - Second date (Date object or UTC string)
 * @returns true if dates are the same day in UTC
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? toLocalDate(date1) : date1;
  const d2 = typeof date2 === 'string' ? toLocalDate(date2) : date2;

  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
}

/**
 * Get YYYY-MM-DD string for date input (local timezone)
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format for input[type="date"]
 */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Create Date from YYYY-MM-DD input value (local timezone)
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object at midnight in local timezone
 */
export function fromDateInputValue(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Combine date and time strings into UTC ISO string
 * @param dateString - Date in YYYY-MM-DD format (local)
 * @param timeString - Time in HH:MM format (24h)
 * @returns UTC ISO string for database storage
 */
export function combineDateTimeToUTC(dateString: string, timeString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hours, minutes);
  return toUTC(localDate);
}

/**
 * Check if a date is in the past (ignoring time)
 * @param date - Date to check (Date object or UTC string)
 * @returns true if date is before today
 */
export function isPastDate(date: Date | string): boolean {
  const checkDate = typeof date === 'string' ? toLocalDate(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

/**
 * Get minimum date for date inputs (today in local timezone)
 * @returns YYYY-MM-DD string for min attribute
 */
export function getMinDateForInput(): string {
  return toDateInputValue(new Date());
}

/**
 * Get maximum date for date inputs (e.g., 90 days from now)
 * @param daysFromNow - Number of days from today
 * @returns YYYY-MM-DD string for max attribute
 */
export function getMaxDateForInput(daysFromNow: number = 90): string {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + daysFromNow);
  return toDateInputValue(maxDate);
}

/**
 * Parse appointment date/time to UTC
 * Legacy support for existing date formats
 * @param dateValue - Date string or Date object
 * @param timeString - Time string (optional, e.g., "14:30")
 * @returns UTC ISO string
 */
export function parseAppointmentDateTime(dateValue: string | Date, timeString?: string): string {
  let date: Date;

  if (typeof dateValue === 'string') {
    // If it's already an ISO string, parse it
    if (dateValue.includes('T') || dateValue.includes('Z')) {
      date = new Date(dateValue);
    } else if (timeString) {
      // If we have separate date and time strings
      return combineDateTimeToUTC(dateValue, timeString);
    } else {
      // Just a date string, treat as local date at midnight
      date = fromDateInputValue(dateValue);
    }
  } else {
    date = dateValue;
  }

  return toUTC(date);
}

/**
 * Get timezone indicator string for UI display
 * @returns String like "PST" or "GMT-8"
 */
export function getTimezoneIndicator(): string {
  const date = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  try {
    // Try to get short timezone name (e.g., "PST", "EST")
    const shortName = date
      .toLocaleTimeString('en-US', {
        timeZoneName: 'short',
      })
      .split(' ')
      .pop();

    return shortName || timeZone;
  } catch {
    // Fallback to timezone name
    return timeZone;
  }
}

/**
 * Get timezone offset string (e.g., "UTC-8" or "UTC+5:30")
 * @returns Offset string for display
 */
export function getTimezoneOffset(): string {
  const offset = -new Date().getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';

  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  }
  return `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Check if a date/time combination is in the past
 * @param dateString - Date in YYYY-MM-DD format
 * @param timeString - Time in HH:MM format
 * @returns true if the combined date/time is in the past
 */
export function isDateTimePast(dateString: string, timeString: string): boolean {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  const dateTime = new Date(year, month - 1, day, hours, minutes);
  return dateTime < new Date();
}

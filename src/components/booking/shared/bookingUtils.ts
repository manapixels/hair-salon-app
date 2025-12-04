'use client';

import { toZonedTime } from 'date-fns-tz';

// Get the salon's timezone from environment variable or default to Asia/Singapore
export const SALON_TIMEZONE = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_TIMEZONE || 'Asia/Singapore';

// Helper function to get the current date in the salon's timezone
export const getTodayInSalonTimezone = (): Date => {
  const now = new Date();
  return toZonedTime(now, SALON_TIMEZONE);
};

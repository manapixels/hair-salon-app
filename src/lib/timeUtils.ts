/**
 * Time utility functions for appointment booking
 */

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
 * Format duration in human-readable format
 * @param minutes - Duration in minutes
 * @returns Human-readable format like "3h 30min" or "45min"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
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

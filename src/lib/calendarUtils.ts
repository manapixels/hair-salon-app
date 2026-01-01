/**
 * Calendar utility functions for generating calendar event links and files.
 * Supports Google Calendar (URL) and Apple Calendar/Outlook (iCal .ics file).
 */

interface CalendarEventDetails {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  durationMinutes: number;
}

/**
 * Formats a Date object to the Google Calendar URL date format (YYYYMMDDTHHmmssZ).
 * Uses UTC time to ensure consistency across timezones.
 */
function formatGoogleCalendarDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * Formats a Date object to iCal format (YYYYMMDDTHHmmss).
 * Note: Using local time format without Z suffix for better local calendar integration.
 */
function formatIcsDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Generates a Google Calendar URL that opens with pre-filled event details.
 * Opens in a new tab for the user to add the event to their calendar.
 */
export function generateGoogleCalendarUrl(event: CalendarEventDetails): string {
  const endDate = new Date(event.startDate.getTime() + event.durationMinutes * 60 * 1000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleCalendarDate(event.startDate)}/${formatGoogleCalendarDate(endDate)}`,
    details: event.description,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates and downloads an iCal (.ics) file for Apple Calendar/Outlook.
 * Creates a properly formatted iCalendar file following RFC 5545.
 */
export function downloadIcsFile(event: CalendarEventDetails): void {
  const endDate = new Date(event.startDate.getTime() + event.durationMinutes * 60 * 1000);
  const now = new Date();

  // Generate a unique ID for the event
  const uid = `${now.getTime()}-${Math.random().toString(36).substr(2, 9)}@signaturetrims.com`;

  // Escape special characters in text fields
  const escapeIcsText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Signature Trims//Booking System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(event.startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  // Create and download the file
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'appointment.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper function to create event details from booking information.
 */
export function createCalendarEventFromBooking(
  serviceName: string,
  stylistName: string | null,
  date: Date,
  time: string,
  durationMinutes: number,
  location: string = 'Signature Trims',
): CalendarEventDetails {
  // Parse time string (HH:MM format)
  const [hours, minutes] = time.split(':').map(Number);

  // Create the start date with the correct time
  const startDate = new Date(date);
  startDate.setHours(hours, minutes, 0, 0);

  const title = stylistName ? `${serviceName} with ${stylistName}` : `${serviceName} Appointment`;

  const description = stylistName
    ? `Hair appointment: ${serviceName} with ${stylistName}`
    : `Hair appointment: ${serviceName}`;

  return {
    title,
    description,
    location,
    startDate,
    durationMinutes,
  };
}

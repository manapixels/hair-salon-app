import { google } from 'googleapis';
import type { Appointment } from '../types';

/**
 * Google Calendar integration for appointment management.
 * Requires Google Calendar API credentials to be configured.
 */

// Initialize Google Calendar client
let calendar: any = null;

const initializeGoogleCalendar = () => {
  if (calendar) return calendar;

  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!credentials) {
    console.warn(
      'Google Calendar: Service account credentials not found. Calendar integration disabled.',
    );
    return null;
  }

  if (!calendarId) {
    console.warn('Google Calendar: Calendar ID not found. Using primary calendar.');
  }

  try {
    const serviceAccount = JSON.parse(credentials);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    calendar = google.calendar({
      version: 'v3',
      auth: auth,
    });

    console.log('Google Calendar API initialized successfully');
    return calendar;
  } catch (error) {
    console.error(
      'Failed to initialize Google Calendar API. Check GOOGLE_SERVICE_ACCOUNT_KEY format.',
      error,
    );
    return null;
  }
};

/**
 * Creates an event in Google Calendar for the new appointment.
 * @param appointment The appointment details.
 * @returns The created event ID or null if failed
 */
export const createCalendarEvent = async (appointment: Appointment): Promise<string | null> => {
  console.log('Creating Google Calendar event for:', appointment.customerName);

  const calendarClient = initializeGoogleCalendar();
  if (!calendarClient) {
    console.log('Google Calendar not configured, skipping event creation');
    return null;
  }

  const eventStartTime = new Date(
    `${appointment.date.toISOString().split('T')[0]}T${appointment.time}`,
  );
  const eventEndTime = new Date(eventStartTime.getTime() + appointment.totalDuration * 60000);

  const stylistInfo = appointment.stylist ? `\nStylist: ${appointment.stylist.name}` : '';
  const event = {
    summary: `Signature Trims Appointment: ${appointment.customerName}${appointment.stylist ? ` (${appointment.stylist.name})` : ''}`,
    description: `Services: ${appointment.services.map(s => s.name).join(', ')}\nCustomer: ${appointment.customerName}\nEmail: ${appointment.customerEmail}${stylistInfo}\nTotal Price: $${appointment.totalPrice}\nDuration: ${appointment.totalDuration} minutes`,
    start: {
      dateTime: eventStartTime.toISOString(),
      timeZone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Los_Angeles',
    },
    end: {
      dateTime: eventEndTime.toISOString(),
      timeZone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Los_Angeles',
    },
    attendees: [{ email: appointment.customerEmail }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 60 }, // 1 hour before
      ],
    },
  };

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    const response = await calendarClient.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    console.log(`Google Calendar event created: ${response.data.htmlLink}`);
    return response.data.id;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    // Don't fail the appointment creation if calendar fails
    return null;
  }
};

/**
 * Updates an existing Google Calendar event.
 * @param eventId The Google Calendar event ID
 * @param appointment The updated appointment details
 * @returns True if successful, false otherwise
 */
export const updateCalendarEvent = async (
  eventId: string,
  appointment: Appointment,
): Promise<boolean> => {
  console.log('Updating Google Calendar event:', eventId);

  const calendarClient = initializeGoogleCalendar();
  if (!calendarClient || !eventId) {
    console.log('Google Calendar not configured or missing event ID, skipping update');
    return false;
  }

  const eventStartTime = new Date(
    `${appointment.date.toISOString().split('T')[0]}T${appointment.time}`,
  );
  const eventEndTime = new Date(eventStartTime.getTime() + appointment.totalDuration * 60000);

  const stylistInfo = appointment.stylist ? `\nStylist: ${appointment.stylist.name}` : '';
  const event = {
    summary: `Signature Trims Appointment: ${appointment.customerName}${appointment.stylist ? ` (${appointment.stylist.name})` : ''}`,
    description: `Services: ${appointment.services.map(s => s.name).join(', ')}\nCustomer: ${appointment.customerName}\nEmail: ${appointment.customerEmail}${stylistInfo}\nTotal Price: $${appointment.totalPrice}\nDuration: ${appointment.totalDuration} minutes`,
    start: {
      dateTime: eventStartTime.toISOString(),
      timeZone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Los_Angeles',
    },
    end: {
      dateTime: eventEndTime.toISOString(),
      timeZone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Los_Angeles',
    },
    attendees: [{ email: appointment.customerEmail }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 60 },
      ],
    },
  };

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    await calendarClient.events.update({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: event,
    });

    console.log(`Google Calendar event updated: ${eventId}`);
    return true;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return false;
  }
};

/**
 * Deletes a Google Calendar event.
 * @param eventId The Google Calendar event ID
 * @returns True if successful, false otherwise
 */
export const deleteCalendarEvent = async (eventId: string): Promise<boolean> => {
  console.log('Deleting Google Calendar event:', eventId);

  const calendarClient = initializeGoogleCalendar();
  if (!calendarClient || !eventId) {
    console.log('Google Calendar not configured or missing event ID, skipping deletion');
    return false;
  }

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    await calendarClient.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });

    console.log(`Google Calendar event deleted: ${eventId}`);
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return false;
  }
};

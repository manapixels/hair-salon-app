import { google } from 'googleapis';
import type { Appointment, Stylist } from '../types';
import { getStylistById, updateStylistGoogleTokens } from './database';

/**
 * Google Calendar integration for appointment management.
 * Supports both:
 * 1. Service account (salon-wide calendar) - via GOOGLE_SERVICE_ACCOUNT_KEY
 * 2. Per-stylist OAuth (individual calendars) - via stylist's stored tokens
 */

// Salon-wide calendar client (service account)
let salonCalendar: any = null;

/**
 * Initialize salon-wide Google Calendar (service account)
 */
const initializeSalonCalendar = () => {
  if (salonCalendar) return salonCalendar;

  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!credentials) {
    console.warn(
      'Google Calendar: Service account credentials not found. Salon calendar disabled.',
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

    salonCalendar = google.calendar({
      version: 'v3',
      auth: auth,
    });

    console.log('Salon Google Calendar API initialized successfully');
    return salonCalendar;
  } catch (error) {
    console.error(
      'Failed to initialize Salon Google Calendar API. Check GOOGLE_SERVICE_ACCOUNT_KEY format.',
      error,
    );
    return null;
  }
};

/**
 * Initialize per-stylist Google Calendar using their OAuth tokens
 */
const initializeStylistCalendar = async (stylist: Stylist): Promise<any | null> => {
  console.log(`[GoogleCalendar] Initializing calendar for stylist ${stylist.id} (${stylist.name})`);
  console.log(`[GoogleCalendar] Token status:`, {
    hasAccessToken: !!stylist.googleAccessToken,
    hasRefreshToken: !!stylist.googleRefreshToken,
    tokenExpiry: stylist.googleTokenExpiry,
    googleEmail: stylist.googleEmail,
    calendarId: stylist.googleCalendarId,
  });

  if (!stylist.googleRefreshToken || !stylist.googleAccessToken) {
    console.warn(
      `[GoogleCalendar] Missing tokens for stylist ${stylist.id}: refreshToken=${!!stylist.googleRefreshToken}, accessToken=${!!stylist.googleAccessToken}`,
    );
    return null;
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn(
      `[GoogleCalendar] OAuth not configured: CLIENT_ID=${!!clientId}, CLIENT_SECRET=${!!clientSecret}`,
    );
    return null;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

    oauth2Client.setCredentials({
      access_token: stylist.googleAccessToken,
      refresh_token: stylist.googleRefreshToken,
      expiry_date: stylist.googleTokenExpiry?.getTime(),
    });

    // Check if token is expired and refresh if needed
    const tokenExpiry = stylist.googleTokenExpiry?.getTime() || 0;
    const now = Date.now();
    console.log(
      `[GoogleCalendar] Token expiry check: now=${new Date(now).toISOString()}, expiry=${new Date(tokenExpiry).toISOString()}, needsRefresh=${now > tokenExpiry - 60000}`,
    );

    if (now > tokenExpiry - 60000) {
      // Refresh 1 minute before expiry
      console.log(`[GoogleCalendar] Refreshing token for stylist ${stylist.id}...`);
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log(`[GoogleCalendar] Token refreshed successfully for stylist ${stylist.id}`);

        // Update tokens in database
        await updateStylistGoogleTokens(stylist.id, {
          googleAccessToken: credentials.access_token!,
          googleRefreshToken: credentials.refresh_token || stylist.googleRefreshToken,
          googleTokenExpiry: new Date(credentials.expiry_date!),
          googleCalendarId: stylist.googleCalendarId || 'primary',
          googleEmail: stylist.googleEmail || '',
        });

        oauth2Client.setCredentials(credentials);
      } catch (refreshError: any) {
        console.error(`[GoogleCalendar] Token refresh FAILED for stylist ${stylist.id}:`, {
          error: refreshError.message,
          code: refreshError.code,
          response: refreshError.response?.data,
        });
        // If refresh fails with invalid_grant, the token was revoked
        if (refreshError.response?.data?.error === 'invalid_grant') {
          console.error(
            `[GoogleCalendar] Refresh token was revoked/expired. Stylist needs to reconnect Google Calendar.`,
          );
        }
        return null;
      }
    }

    console.log(`[GoogleCalendar] Calendar client initialized for stylist ${stylist.id}`);
    return google.calendar({ version: 'v3', auth: oauth2Client });
  } catch (error: any) {
    console.error(`[GoogleCalendar] Failed to initialize calendar for stylist ${stylist.id}:`, {
      error: error.message,
      code: error.code,
      stack: error.stack,
    });
    return null;
  }
};

/**
 * Build the event object for calendar
 */
const buildCalendarEvent = (appointment: Appointment) => {
  const eventStartTime = new Date(
    `${appointment.date.toISOString().split('T')[0]}T${appointment.time}`,
  );
  const eventEndTime = new Date(eventStartTime.getTime() + appointment.totalDuration * 60000);

  const stylistInfo = appointment.stylist ? `\nStylist: ${appointment.stylist.name}` : '';

  return {
    summary: `Signature Trims: ${appointment.customerName}${appointment.stylist ? ` (${appointment.stylist.name})` : ''}`,
    description: `Services: ${appointment.services.map(s => s.name).join(', ')}\nCustomer: ${appointment.customerName}\nEmail: ${appointment.customerEmail}${stylistInfo}\nDuration: ${appointment.totalDuration} minutes`,
    start: {
      dateTime: eventStartTime.toISOString(),
      timeZone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'Asia/Singapore',
    },
    end: {
      dateTime: eventEndTime.toISOString(),
      timeZone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'Asia/Singapore',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 }, // 1 hour before
        { method: 'popup', minutes: 15 }, // 15 minutes before
      ],
    },
  };
};

/**
 * Creates an event in Google Calendar for the new appointment.
 * Attempts stylist's personal calendar first, then falls back to salon calendar.
 * @param appointment The appointment details.
 * @returns The created event ID or null if failed
 */
export const createCalendarEvent = async (appointment: Appointment): Promise<string | null> => {
  console.log(`[GoogleCalendar] Creating event for appointment:`, {
    customerName: appointment.customerName,
    stylistId: appointment.stylistId,
    date: appointment.date,
    time: appointment.time,
  });

  const event = buildCalendarEvent(appointment);

  // Try stylist's personal calendar first
  if (appointment.stylistId) {
    console.log(
      `[GoogleCalendar] Attempting stylist calendar for stylistId: ${appointment.stylistId}`,
    );
    const stylist = await getStylistById(appointment.stylistId);

    if (!stylist) {
      console.warn(`[GoogleCalendar] Stylist not found for ID: ${appointment.stylistId}`);
    } else {
      console.log(
        `[GoogleCalendar] Stylist found: ${stylist.name}, hasRefreshToken: ${!!stylist.googleRefreshToken}`,
      );

      if (stylist.googleRefreshToken) {
        const stylistCalendar = await initializeStylistCalendar(stylist);
        if (stylistCalendar) {
          try {
            const calendarId = stylist.googleCalendarId || 'primary';
            console.log(`[GoogleCalendar] Inserting event to calendar: ${calendarId}`);
            const response = await stylistCalendar.events.insert({
              calendarId,
              requestBody: event,
            });
            console.log(
              `[GoogleCalendar] ✅ Event created on stylist ${stylist.name}'s calendar: ${response.data.htmlLink}`,
            );
            return response.data.id;
          } catch (error: any) {
            console.error(
              `[GoogleCalendar] ❌ Failed to create event on stylist ${stylist.name}'s calendar:`,
              {
                error: error.message,
                code: error.code,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
              },
            );
            // Fall through to salon calendar
          }
        } else {
          console.warn(`[GoogleCalendar] Could not initialize stylist calendar (returned null)`);
        }
      } else {
        console.warn(
          `[GoogleCalendar] Stylist ${stylist.name} has no refresh token - calendar not connected`,
        );
      }
    }
  } else {
    console.log(`[GoogleCalendar] No stylistId on appointment, skipping stylist calendar`);
  }

  // Fallback to salon-wide calendar
  console.log(`[GoogleCalendar] Falling back to salon calendar...`);
  const salonCalendarClient = initializeSalonCalendar();
  if (!salonCalendarClient) {
    console.warn(
      `[GoogleCalendar] ❌ No salon calendar configured, skipping event creation entirely`,
    );
    return null;
  }

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    console.log(`[GoogleCalendar] Inserting event to salon calendar: ${calendarId}`);
    const response = await salonCalendarClient.events.insert({
      calendarId,
      requestBody: { ...event, attendees: [{ email: appointment.customerEmail }] },
    });

    console.log(`[GoogleCalendar] ✅ Event created on salon calendar: ${response.data.htmlLink}`);
    return response.data.id;
  } catch (error: any) {
    console.error(`[GoogleCalendar] ❌ Error creating event on salon calendar:`, {
      error: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    });
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

  if (!eventId) {
    console.log('Missing event ID, skipping update');
    return false;
  }

  const event = buildCalendarEvent(appointment);

  // Try stylist's calendar first
  if (appointment.stylistId) {
    const stylist = await getStylistById(appointment.stylistId);
    if (stylist?.googleRefreshToken) {
      const stylistCalendar = await initializeStylistCalendar(stylist);
      if (stylistCalendar) {
        try {
          const calendarId = stylist.googleCalendarId || 'primary';
          await stylistCalendar.events.update({
            calendarId,
            eventId,
            requestBody: event,
          });
          console.log(`Calendar event updated on stylist ${stylist.name}'s calendar: ${eventId}`);
          return true;
        } catch (error: any) {
          // If event not found on stylist calendar, try salon calendar
          if (error?.response?.status !== 404) {
            console.error(`Failed to update event on stylist ${stylist.name}'s calendar:`, error);
          }
        }
      }
    }
  }

  // Fallback to salon calendar
  const salonCalendarClient = initializeSalonCalendar();
  if (!salonCalendarClient) {
    console.log('Google Calendar not configured, skipping update');
    return false;
  }

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    await salonCalendarClient.events.update({
      calendarId,
      eventId,
      requestBody: { ...event, attendees: [{ email: appointment.customerEmail }] },
    });

    console.log(`Google Calendar event updated on salon calendar: ${eventId}`);
    return true;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return false;
  }
};

/**
 * Deletes a Google Calendar event.
 * @param eventId The Google Calendar event ID
 * @param stylistId Optional stylist ID to try their calendar first
 * @returns True if successful, false otherwise
 */
export const deleteCalendarEvent = async (
  eventId: string,
  stylistId?: string | null,
): Promise<boolean> => {
  console.log('Deleting Google Calendar event:', eventId);

  if (!eventId) {
    console.log('Missing event ID, skipping deletion');
    return false;
  }

  // Try stylist's calendar first
  if (stylistId) {
    const stylist = await getStylistById(stylistId);
    if (stylist?.googleRefreshToken) {
      const stylistCalendar = await initializeStylistCalendar(stylist);
      if (stylistCalendar) {
        try {
          const calendarId = stylist.googleCalendarId || 'primary';
          await stylistCalendar.events.delete({
            calendarId,
            eventId,
          });
          console.log(`Calendar event deleted from stylist ${stylist.name}'s calendar: ${eventId}`);
          return true;
        } catch (error: any) {
          // If event not found on stylist calendar, try salon calendar
          if (error?.response?.status !== 404) {
            console.error(`Failed to delete event from stylist ${stylist.name}'s calendar:`, error);
          }
        }
      }
    }
  }

  // Fallback to salon calendar
  const salonCalendarClient = initializeSalonCalendar();
  if (!salonCalendarClient) {
    console.log('Google Calendar not configured, skipping deletion');
    return false;
  }

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    await salonCalendarClient.events.delete({
      calendarId,
      eventId,
    });

    console.log(`Google Calendar event deleted from salon calendar: ${eventId}`);
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return false;
  }
};

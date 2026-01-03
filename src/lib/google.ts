import type { Appointment, Stylist } from '../types';
import { getStylistById, updateStylistGoogleTokens, markStylistTokenInvalid } from './database';

/**
 * Google Calendar integration for appointment management.
 * Cloudflare Workers compatible - uses native fetch API instead of googleapis.
 *
 * Supports both:
 * 1. Service account (salon-wide calendar) - via GOOGLE_SERVICE_ACCOUNT_KEY
 * 2. Per-stylist OAuth (individual calendars) - via stylist's stored tokens
 */

// ============================================================================
// Types
// ============================================================================

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
  attendees?: Array<{ email: string }>;
}

interface GoogleCalendarEventResponse {
  id: string;
  htmlLink: string;
  summary: string;
  status: string;
}

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Cached service account access token
let serviceAccountToken: { accessToken: string; expiry: number } | null = null;

// ============================================================================
// JWT / Service Account Token Generation
// ============================================================================

/**
 * Base64 URL encode (for JWT)
 */
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Import private key for signing JWT (Web Crypto API)
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Remove PEM headers and decode base64
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/**
 * Sign data with private key (Web Crypto API)
 */
async function signJwt(data: string, privateKey: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, encoder.encode(data));
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Generate a JWT for service account authentication
 */
async function generateServiceAccountJwt(credentials: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const privateKey = await importPrivateKey(credentials.private_key);
  const signature = await signJwt(unsignedToken, privateKey);

  return `${unsignedToken}.${signature}`;
}

/**
 * Get access token for service account
 */
async function getServiceAccountToken(): Promise<string | null> {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!credentials) {
    console.warn('[GoogleCalendar] Service account credentials not found');
    return null;
  }

  // Check cached token
  if (serviceAccountToken && Date.now() < serviceAccountToken.expiry - 60000) {
    return serviceAccountToken.accessToken;
  }

  try {
    const serviceAccount: ServiceAccountCredentials = JSON.parse(credentials);
    const jwt = await generateServiceAccountJwt(serviceAccount);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }).toString(),
    });

    const data = (await response.json()) as GoogleTokenResponse;

    if (!response.ok || data.error) {
      console.error('[GoogleCalendar] Service account token error:', data);
      return null;
    }

    // Cache the token
    serviceAccountToken = {
      accessToken: data.access_token,
      expiry: Date.now() + data.expires_in * 1000,
    };

    console.log('[GoogleCalendar] Service account token obtained');
    return data.access_token;
  } catch (error) {
    console.error('[GoogleCalendar] Failed to get service account token:', error);
    return null;
  }
}

// ============================================================================
// OAuth Token Refresh (for Stylists)
// ============================================================================

/**
 * Refresh OAuth access token using refresh token
 */
async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number } | null> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('[GoogleCalendar] OAuth credentials not configured');
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    const data = (await response.json()) as GoogleTokenResponse;

    if (!response.ok || data.error) {
      console.error('[GoogleCalendar] Token refresh error:', data);
      return null;
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Keep old if not returned
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('[GoogleCalendar] Failed to refresh token:', error);
    return null;
  }
}

/**
 * Get valid access token for a stylist (refresh if needed)
 */
async function getStylistAccessToken(stylist: Stylist): Promise<string | null> {
  console.log(`[GoogleCalendar] Getting token for stylist ${stylist.id} (${stylist.name})`);

  if (!stylist.googleRefreshToken || !stylist.googleAccessToken) {
    console.warn(`[GoogleCalendar] Missing tokens for stylist ${stylist.id}`);
    return null;
  }

  const tokenExpiry = stylist.googleTokenExpiry?.getTime() || 0;
  const now = Date.now();

  // Check if token is still valid (with 1 min buffer)
  if (now < tokenExpiry - 60000) {
    console.log(`[GoogleCalendar] Using cached token for stylist ${stylist.id}`);
    return stylist.googleAccessToken;
  }

  // Need to refresh
  console.log(`[GoogleCalendar] Refreshing token for stylist ${stylist.id}`);
  const refreshed = await refreshAccessToken(stylist.googleRefreshToken);

  if (!refreshed) {
    console.error(`[GoogleCalendar] Token refresh failed for stylist ${stylist.id}`);
    // Mark token as invalid
    await markStylistTokenInvalid(stylist.id, true);
    return null;
  }

  // Update tokens in database
  await updateStylistGoogleTokens(stylist.id, {
    googleAccessToken: refreshed.accessToken,
    googleRefreshToken: refreshed.refreshToken,
    googleTokenExpiry: new Date(Date.now() + refreshed.expiresIn * 1000),
    googleCalendarId: stylist.googleCalendarId || 'primary',
    googleEmail: stylist.googleEmail || '',
  });

  console.log(`[GoogleCalendar] Token refreshed for stylist ${stylist.id}`);
  return refreshed.accessToken;
}

// ============================================================================
// Calendar API Operations
// ============================================================================

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Build the event object for calendar
 */
function buildCalendarEvent(appointment: Appointment): GoogleCalendarEvent {
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
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  };
}

/**
 * Insert event to Google Calendar using fetch API
 */
async function insertEvent(
  accessToken: string,
  calendarId: string,
  event: GoogleCalendarEvent,
): Promise<GoogleCalendarEventResponse | null> {
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[GoogleCalendar] Insert event error:', error);
      return null;
    }

    return (await response.json()) as GoogleCalendarEventResponse;
  } catch (error) {
    console.error('[GoogleCalendar] Insert event failed:', error);
    return null;
  }
}

/**
 * Update event in Google Calendar using fetch API
 */
async function updateEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: GoogleCalendarEvent,
): Promise<boolean> {
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[GoogleCalendar] Update event error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[GoogleCalendar] Update event failed:', error);
    return false;
  }
}

/**
 * Delete event from Google Calendar using fetch API
 */
async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
): Promise<boolean> {
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // 204 No Content = success, 404 = already deleted (also ok)
    if (response.ok || response.status === 204 || response.status === 404) {
      return true;
    }

    const error = await response.json();
    console.error('[GoogleCalendar] Delete event error:', error);
    return false;
  } catch (error) {
    console.error('[GoogleCalendar] Delete event failed:', error);
    return false;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Creates an event in Google Calendar for the new appointment.
 * Attempts stylist's personal calendar first, then falls back to salon calendar.
 */
export async function createCalendarEvent(appointment: Appointment): Promise<string | null> {
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

    if (stylist?.googleRefreshToken) {
      const accessToken = await getStylistAccessToken(stylist);
      if (accessToken) {
        const calendarId = stylist.googleCalendarId || 'primary';
        console.log(`[GoogleCalendar] Inserting event to stylist calendar: ${calendarId}`);

        const result = await insertEvent(accessToken, calendarId, event);
        if (result) {
          console.log(
            `[GoogleCalendar] ✅ Event created on stylist ${stylist.name}'s calendar: ${result.htmlLink}`,
          );
          return result.id;
        }
        console.warn(`[GoogleCalendar] Failed to insert on stylist calendar, falling back...`);
      }
    } else {
      console.warn(
        `[GoogleCalendar] Stylist ${appointment.stylistId} has no Google Calendar connected`,
      );
    }
  }

  // Fallback to salon-wide calendar
  console.log(`[GoogleCalendar] Falling back to salon calendar...`);
  const salonToken = await getServiceAccountToken();
  if (!salonToken) {
    console.warn(`[GoogleCalendar] ❌ No salon calendar configured, skipping event creation`);
    return null;
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const salonEvent = { ...event, attendees: [{ email: appointment.customerEmail }] };

  const result = await insertEvent(salonToken, calendarId, salonEvent);
  if (result) {
    console.log(`[GoogleCalendar] ✅ Event created on salon calendar: ${result.htmlLink}`);
    return result.id;
  }

  console.error(`[GoogleCalendar] ❌ Failed to create event on salon calendar`);
  return null;
}

/**
 * Updates an existing Google Calendar event.
 */
export async function updateCalendarEvent(
  eventId: string,
  appointment: Appointment,
): Promise<boolean> {
  console.log('[GoogleCalendar] Updating event:', eventId);

  if (!eventId) {
    console.log('[GoogleCalendar] Missing event ID, skipping update');
    return false;
  }

  const event = buildCalendarEvent(appointment);

  // Try stylist's calendar first
  if (appointment.stylistId) {
    const stylist = await getStylistById(appointment.stylistId);
    if (stylist?.googleRefreshToken) {
      const accessToken = await getStylistAccessToken(stylist);
      if (accessToken) {
        const calendarId = stylist.googleCalendarId || 'primary';
        const success = await updateEvent(accessToken, calendarId, eventId, event);
        if (success) {
          console.log(
            `[GoogleCalendar] Event updated on stylist ${stylist.name}'s calendar: ${eventId}`,
          );
          return true;
        }
      }
    }
  }

  // Fallback to salon calendar
  const salonToken = await getServiceAccountToken();
  if (!salonToken) {
    console.log('[GoogleCalendar] No salon calendar configured, skipping update');
    return false;
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const salonEvent = { ...event, attendees: [{ email: appointment.customerEmail }] };

  const success = await updateEvent(salonToken, calendarId, eventId, salonEvent);
  if (success) {
    console.log(`[GoogleCalendar] Event updated on salon calendar: ${eventId}`);
    return true;
  }

  console.error('[GoogleCalendar] Failed to update event');
  return false;
}

/**
 * Deletes a Google Calendar event.
 */
export async function deleteCalendarEvent(
  eventId: string,
  stylistId?: string | null,
): Promise<boolean> {
  console.log('[GoogleCalendar] Deleting event:', eventId);

  if (!eventId) {
    console.log('[GoogleCalendar] Missing event ID, skipping deletion');
    return false;
  }

  // Try stylist's calendar first
  if (stylistId) {
    const stylist = await getStylistById(stylistId);
    if (stylist?.googleRefreshToken) {
      const accessToken = await getStylistAccessToken(stylist);
      if (accessToken) {
        const calendarId = stylist.googleCalendarId || 'primary';
        const success = await deleteEvent(accessToken, calendarId, eventId);
        if (success) {
          console.log(
            `[GoogleCalendar] Event deleted from stylist ${stylist.name}'s calendar: ${eventId}`,
          );
          return true;
        }
      }
    }
  }

  // Fallback to salon calendar
  const salonToken = await getServiceAccountToken();
  if (!salonToken) {
    console.log('[GoogleCalendar] No salon calendar configured, skipping deletion');
    return false;
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const success = await deleteEvent(salonToken, calendarId, eventId);
  if (success) {
    console.log(`[GoogleCalendar] Event deleted from salon calendar: ${eventId}`);
    return true;
  }

  console.error('[GoogleCalendar] Failed to delete event');
  return false;
}

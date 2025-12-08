# Stylist Google Calendar Sync - Implementation Plan

Enable individual stylists to connect their personal Google Calendar and receive one-way sync for appointments assigned to them.

## User Review Required

> [!IMPORTANT]
> **Google Cloud Console Setup Required**
> Before implementation, you'll need to:
>
> 1. Create OAuth 2.0 credentials (Web Application type) in Google Cloud Console
> 2. Add authorized redirect URI: `https://yourdomain.com/api/auth/google/callback`
> 3. Enable the Google Calendar API
> 4. Configure the OAuth consent screen (can be "Internal" for testing, or "External" with verification for production)

> [!WARNING]
> **Token Security**: OAuth tokens will be stored encrypted in the database. The `googleRefreshToken` is sensitive and must be protected.

---

## Proposed Changes

### Database Layer

#### [MODIFY] [schema.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/db/schema.ts)

Add Google OAuth token fields to the `stylists` table:

```diff
export const stylists = pgTable('stylists', {
  // ... existing fields ...
+ googleAccessToken: text('googleAccessToken'),
+ googleRefreshToken: text('googleRefreshToken'),
+ googleTokenExpiry: timestamp('googleTokenExpiry'),
+ googleCalendarId: text('googleCalendarId'), // Usually 'primary'
+ googleEmail: text('googleEmail'), // For display purposes
});
```

---

#### [NEW] Database Migration

Create a new migration file to add the columns. Run:

```bash
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

---

### Google OAuth Flow APIs

#### [NEW] [connect/route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/auth/google/connect/route.ts)

Initiates OAuth2 flow for stylists:

- Validates user is logged in and has STYLIST role
- Generates OAuth URL with `calendar.events` scope
- Stores state in session for CSRF protection
- Redirects to Google consent screen

#### [NEW] [callback/route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/auth/google/callback/route.ts)

Handles OAuth callback:

- Exchanges authorization code for tokens
- Stores `accessToken`, `refreshToken`, `tokenExpiry` in stylists table
- Redirects to stylist dashboard with success/error status

#### [NEW] [disconnect/route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/auth/google/disconnect/route.ts)

Disconnects Google Calendar:

- Revokes tokens with Google
- Clears token fields in database

---

### Calendar Sync Logic

#### [MODIFY] [google.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/lib/google.ts)

Refactor to support per-stylist OAuth:

```diff
- const initializeGoogleCalendar = () => {
-   // Uses single service account
+ const initializeStylistCalendar = async (stylistId: string) => {
+   // Load tokens from database for specific stylist
+   const stylist = await getStylistById(stylistId);
+   if (!stylist?.googleRefreshToken) return null;
+
+   // Check token expiry, refresh if needed
+   if (isTokenExpired(stylist.googleTokenExpiry)) {
+     await refreshStylistToken(stylistId);
+   }
+
+   // Initialize OAuth2 client with stylist's tokens
+   const oauth2Client = new google.auth.OAuth2(...);
+   oauth2Client.setCredentials({
+     access_token: stylist.googleAccessToken,
+     refresh_token: stylist.googleRefreshToken,
+   });
+
+   return google.calendar({ version: 'v3', auth: oauth2Client });
+ };
```

Modify event functions:

```diff
- export const createCalendarEvent = async (appointment: Appointment) => {
+ export const createCalendarEvent = async (appointment: Appointment) => {
+   // If appointment has a stylist, try their calendar first
+   if (appointment.stylistId) {
+     const stylistCalendar = await initializeStylistCalendar(appointment.stylistId);
+     if (stylistCalendar) {
+       return createEventOnCalendar(stylistCalendar, appointment, 'primary');
+     }
+   }
+
+   // Fallback to salon's service account calendar (existing behavior)
    const calendarClient = initializeGoogleCalendar();
    // ... existing logic
  };
```

---

### Frontend - Stylist Dashboard

#### [NEW] [StylistDashboard.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/components/views/StylistDashboard.tsx)

New dashboard for stylists (similar to CustomerDashboard but with:

- "My Appointments" section (filtered to assigned appointments)
- "Google Calendar" connection section:
  - If not connected: "Connect Google Calendar" button
  - If connected: Shows connected email + "Disconnect" button

#### [MODIFY] [dashboard/page.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/%5Blocale%5D/dashboard/page.tsx)

Render `StylistDashboard` when user role is `STYLIST`:

```diff
export default function DashboardPage() {
  const { user } = useAuth();

+ if (user?.role === 'STYLIST') {
+   return <StylistDashboard />;
+ }
+
  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  return <CustomerDashboard />;
}
```

---

### Environment Variables

Add to `.env.example`:

```bash
# Google OAuth (for per-stylist calendar sync)
GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_OAUTH_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
```

---

## Verification Plan

### Manual Verification Steps

Since this feature involves OAuth with Google (external service), automated tests are limited. Here's the manual test plan:

#### Test 1: OAuth Connect Flow

1. Log in as a user with STYLIST role (via Telegram/WhatsApp)
2. Go to `/dashboard`
3. Click "Connect Google Calendar"
4. Verify redirect to Google consent screen
5. Grant calendar permissions
6. Verify redirect back to dashboard with "Connected" status

#### Test 2: Appointment Creation Sync

1. While logged in as stylist with connected calendar
2. Book a new appointment (as customer) with that stylist
3. Check the stylist's Google Calendar
4. Verify event appears with correct:
   - Title: "Signature Trims Appointment: [Customer Name]"
   - Date/Time matching booking
   - Description with service details

#### Test 3: Appointment Reschedule Sync

1. Reschedule an existing appointment
2. Check stylist's Google Calendar
3. Verify event is updated to new time

#### Test 4: Appointment Cancel Sync

1. Cancel an existing appointment
2. Check stylist's Google Calendar
3. Verify event is deleted

#### Test 5: Disconnect Flow

1. Click "Disconnect" on stylist dashboard
2. Verify status changes to "Not Connected"
3. Verify tokens are cleared from database

### Automated Tests (TypeScript)

```bash
# Type checking
npx tsc --noEmit

# Linting
npx eslint src/
```

---

## Files Changed Summary

| File                                          | Action | Description                                   |
| --------------------------------------------- | ------ | --------------------------------------------- |
| `src/db/schema.ts`                            | MODIFY | Add Google OAuth fields to stylists table     |
| `src/lib/google.ts`                           | MODIFY | Add per-stylist OAuth calendar initialization |
| `src/app/api/auth/google/connect/route.ts`    | NEW    | OAuth initiation endpoint                     |
| `src/app/api/auth/google/callback/route.ts`   | NEW    | OAuth callback endpoint                       |
| `src/app/api/auth/google/disconnect/route.ts` | NEW    | Disconnect endpoint                           |
| `src/components/views/StylistDashboard.tsx`   | NEW    | Stylist dashboard with calendar connection UI |
| `src/app/[locale]/dashboard/page.tsx`         | MODIFY | Route to StylistDashboard for STYLIST role    |
| `src/lib/database.ts`                         | MODIFY | Add token storage/retrieval functions         |

# Google Calendar Reconnection Reminder System

## Goal Description

Send daily Telegram/WhatsApp reminders to stylists when their Google Calendar connection expires (token revoked or refresh fails). When the stylist reconnects, send a success notification.

## Proposed Changes

### Database Schema

#### [MODIFY] [schema.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/db/schema.ts)

Add two new fields to the `stylists` table:

- `googleTokenInvalid: boolean` - Flag indicating token is invalid
- `lastCalendarReminderSent: timestamp` - Tracks when last reminder was sent (rate limit to 1/day)

---

### Core Logic

#### [NEW] [calendarReminderService.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/services/calendarReminderService.ts)

New service with functions:

- `getStylistsWithExpiredTokens()` - Query stylists where `googleTokenInvalid = true`
- `sendCalendarReconnectReminder(stylist, user)` - Send Telegram/WhatsApp message
- `sendCalendarReconnectSuccess(stylist, user)` - Send success message when reconnected
- `markCalendarReminderSent(stylistId)` - Update `lastCalendarReminderSent`

---

#### [MODIFY] [google.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/lib/google.ts)

Modify `initializeStylistCalendar()`:

1. When `invalid_grant` error occurs, set `googleTokenInvalid = true` on the stylist
2. Add a new exported function `markStylistTokenInvalid(stylistId)` to set the flag

---

#### [MODIFY] [database.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/lib/database.ts)

Add functions:

- `getStylistsWithInvalidTokens()` - Returns stylists where `googleTokenInvalid = true` and `lastCalendarReminderSent` is null or > 24 hours ago
- `markStylistTokenInvalid(stylistId, invalid: boolean)` - Update the flag
- `updateLastCalendarReminderSent(stylistId)` - Set timestamp
- `getStylistWithUser(stylistId)` - Get stylist with associated user for messaging

---

#### [MODIFY] OAuth callback routes

When stylist successfully reconnects Google Calendar (in the OAuth callback), call:

1. `markStylistTokenInvalid(stylistId, false)` - Clear the invalid flag
2. `sendCalendarReconnectSuccess(stylist, user)` - Send success notification

---

### API Route

#### [NEW] [route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/calendar-reminders/send/route.ts)

Cron job endpoint:

- `POST /api/calendar-reminders/send` - Triggered daily by GitHub Actions or Inngest
- Queries stylists with invalid tokens
- Sends reminders via Telegram/WhatsApp
- Updates `lastCalendarReminderSent`

---

## Message Templates

### Reconnection Reminder (Daily)

```
⚠️ Google Calendar Disconnected

Hi {stylistName}! Your Google Calendar connection has expired.

New appointments won't sync to your calendar until you reconnect.

👉 Tap here to reconnect: {reconnectUrl}

This reminder will repeat daily until reconnected.
```

### Reconnection Success

```
✅ Google Calendar Reconnected!

Hi {stylistName}! Your calendar is now synced again.

Future appointments will appear on your Google Calendar automatically.
```

---

## Verification Plan

### Automated Tests

- Unit test for `getStylistsWithInvalidTokens()` query
- Unit test for message formatting

### Manual Verification

1. Manually set `googleTokenInvalid = true` for a test stylist in DB
2. Hit `POST /api/calendar-reminders/send`
3. Verify stylist receives Telegram/WhatsApp message
4. Reconnect calendar and verify success message is sent

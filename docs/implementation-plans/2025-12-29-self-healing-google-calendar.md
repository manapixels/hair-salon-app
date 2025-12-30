# Self-Healing Google Calendar Integration

Make the Google Calendar sync resilient so stylists never need to debug OAuth issues.

## Problem Statement

When a stylist's Google OAuth token expires or is revoked:

1. Calendar sync silently fails during appointment creation
2. The hourly `syncCalendar` Inngest job also silently fails
3. Dashboard still shows "Connected" (checks only `googleEmail` existence, not token validity)
4. Stylist has no idea their calendar isn't syncing

---

## Proposed Changes

### 1. Token Health Check on Dashboard Load

#### [MODIFY] [StylistDashboard.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/components/views/StylistDashboard.tsx)

Add a token validity check when fetching stylist profile. Show a soft warning if token is expired/invalid instead of showing "Connected".

---

#### [MODIFY] [route.ts (stylists/me)](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/stylists/me/route.ts)

Return `googleTokenStatus: 'valid' | 'expired' | 'error'` in the API response by checking token expiry date.

---

### 2. Proactive Token Refresh Job

#### [NEW] [refreshGoogleTokens.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/inngest/refreshGoogleTokens.ts)

New Inngest function that runs daily:

1. Finds all stylists with Google tokens
2. For tokens expiring within 7 days, proactively refresh them
3. If refresh fails (revoked), mark `googleTokenStatus` field as `needs_reconnect`
4. Send a friendly WhatsApp/Telegram notification to the stylist asking them to reconnect

---

### 3. Dashboard Warning for Token Issues

#### [MODIFY] [StylistDashboard.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/components/views/StylistDashboard.tsx)

When `googleTokenStatus === 'needs_reconnect'`:

- Show an amber/warning card instead of green "Connected" card
- Simple message: "Your Google Calendar connection needs to be refreshed. Click to reconnect."
- Single "Reconnect" button that triggers the OAuth flow

---

### 4. Retry Failed Calendar Syncs

#### [MODIFY] [syncCalendar.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/inngest/syncCalendar.ts)

Improve the existing hourly sync job:

1. Track retry count per appointment (add `calendarSyncRetries` field)
2. Skip appointments that have failed 3+ times (prevents infinite retry)
3. When all retries exhausted, send notification to admin

---

### 5. Add Token Status Field to Schema

#### [MODIFY] [schema.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/db/schema.ts)

Add field to `stylists` table:

```typescript
googleTokenStatus: text('googleTokenStatus').default('valid'), // 'valid' | 'expired' | 'needs_reconnect'
```

---

### 6. Friendly Stylist Notification

#### [MODIFY] [messagingService.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/services/messagingService.ts)

Add new function `sendGoogleCalendarReconnectNotification()`:

- Sends via WhatsApp/Telegram (based on stylist's linked user account)
- Friendly message: "Hi [name]! Your Google Calendar connection needs a quick refresh to keep syncing appointments. Tap here to reconnect: [link]"

---

## User Review Required

> [!IMPORTANT] > **Notification Preference**: Should we send reconnect notifications via:
>
> - A) WhatsApp/Telegram (proactive, may feel intrusive)
> - B) Email only (less intrusive, may be ignored)
> - C) Dashboard-only warning (zero notifications, relies on stylist checking dashboard)

> [!NOTE]
> The implementation adds a new database migration for `googleTokenStatus` field.

---

## Verification Plan

### Automated Tests

- None currently exist for Google Calendar integration. Will rely on manual verification.

### Manual Verification

1. **Token Expiry Warning Test**:
   - Manually set `googleTokenExpiry` to a past date in the database
   - Load stylist dashboard
   - Verify warning/amber card is shown instead of green "Connected"
   - Click "Reconnect" and verify OAuth flow works

2. **Proactive Refresh Test**:
   - Trigger the `refreshGoogleTokens` Inngest function manually
   - Verify tokens expiring soon are refreshed
   - Verify notifications are sent for failed refreshes

3. **Retry Logic Test**:
   - Create an appointment with an invalid stylist calendar setup
   - Verify `syncCalendar` job increments retry count
   - Verify it stops after 3 retries

---

## Summary

| Issue                        | Solution                                         |
| ---------------------------- | ------------------------------------------------ |
| Silent OAuth failures        | Dashboard shows token status, not just existence |
| Token expiry                 | Proactive daily refresh job                      |
| Revoked tokens               | Friendly notification + easy reconnect button    |
| Permanent sync failures      | Retry limit + admin notification                 |
| Non-technical users confused | Clear UI messages, no OAuth jargon               |

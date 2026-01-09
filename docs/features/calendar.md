# Stylist Google Calendar Sync

Stylists can connect their personal Google Calendar to automatically sync appointments.

---

## Key Files

| File                                                             | Purpose                                |
| ---------------------------------------------------------------- | -------------------------------------- |
| `src/app/api/auth/google/connect\|callback\|disconnect/route.ts` | OAuth routes                           |
| `src/lib/google.ts`                                              | Per-stylist OAuth + fallback to salon  |
| `src/db/schema.ts`                                               | `stylists` table includes OAuth tokens |
| `src/components/views/StylistDashboard.tsx`                      | Profile Management & Calendar Sync     |
| `src/app/api/stylists/me/route.ts`                               | Returns `googleTokenStatus`            |

---

## Self-Healing Token System

The dashboard shows token status with clear, non-technical UI:

| Status               | Color | User Action              |
| -------------------- | ----- | ------------------------ |
| "Connected"          | Green | Token valid, syncing     |
| "Connection Expired" | Amber | Friendly "Reconnect" btn |
| "Not Connected"      | Gray  | Calendar not connected   |

Token status values: `valid` | `expiring_soon` | `expired` | `not_connected`

> [!NOTE]
> If OAuth app is in "Testing" mode, refresh tokens expire after 7 days. Publish the OAuth consent screen to get permanent tokens.

---

## Required Environment Variables

```bash
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
```

---

## Cloudflare Workers Compatibility

The `src/lib/google.ts` library uses native `fetch` API and Web Crypto API:

- **Token Refresh**: Uses `fetch` to refresh OAuth tokens
- **Service Account JWT**: Uses Web Crypto `RSASSA-PKCS1-v1_5` for JWT signing
- **Calendar CRUD**: Uses `fetch` for create/update/delete events

> [!NOTE]
> The `googleapis` library was removed because it uses Node.js `https` module which is not available in Cloudflare Workers runtime.

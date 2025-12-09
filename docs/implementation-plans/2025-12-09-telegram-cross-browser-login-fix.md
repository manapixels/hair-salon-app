# Telegram Cross-Browser Login Fix

When users initiate Telegram login from their browser, the "Complete Login" link opens in Telegram's in-built browser. The session cookie gets set there instead of the original browser where login was initiated.

## Proposed Changes

### Database Schema

#### [MODIFY] [schema.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/db/schema.ts)

Add `status` column to `loginTokens` table to track login completion state:

- `PENDING` - Token created, user hasn't completed login in Telegram yet
- `COMPLETED` - User clicked "Complete Login", ready for original browser to claim

```diff
 export const loginTokens = pgTable(
   'LoginToken',
   {
     id: text('id')...
     token: text('token').notNull().unique(),
     userId: text('userId')...
     expiresAt: timestamp('expiresAt').notNull(),
+    status: text('status').default('PENDING').notNull(),
     createdAt: timestamp('createdAt').defaultNow().notNull(),
   },
   ...
 );
```

---

### Backend API Routes

#### [NEW] [check-login-status/route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/auth/telegram/check-login-status/route.ts)

Polling endpoint for original browser to check if login is complete.

**Request**: `GET /api/auth/telegram/check-login-status?token=xxx`
**Response**:

```json
{ "status": "pending" | "completed" | "expired" | "not_found" }
```

---

#### [NEW] [claim-session/route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/auth/telegram/claim-session/route.ts)

Endpoint for original browser to claim the session and set its own cookie.

**Request**: `POST /api/auth/telegram/claim-session` with `{ token: string }`
**Response**: Sets session cookie, returns `{ success: true }`

---

#### [MODIFY] [verify-login/route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/auth/telegram/verify-login/route.ts)

Change behavior from setting cookie to marking token as COMPLETED:

```diff
-    await setSessionCookie(userForSession);
-    await db.delete(schema.loginTokens).where(eq(schema.loginTokens.id, tokenData.id));
-    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?login=success`);
+    // Mark as completed instead of setting cookie
+    await db.update(schema.loginTokens)
+      .set({ status: 'COMPLETED' })
+      .where(eq(schema.loginTokens.id, tokenData.id));
+    // Return success page (for Telegram's browser)
+    return new NextResponse(successHtmlPage, { headers: { 'Content-Type': 'text/html' } });
```

---

### Frontend

#### [MODIFY] [TelegramLoginWidget.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/components/auth/TelegramLoginWidget.tsx)

Add polling logic to detect when login is complete and claim the session:

1. After opening Telegram deep link, poll `/api/auth/telegram/check-login-status?token=xxx` every 2 seconds
2. When status is `completed`, call `/api/auth/telegram/claim-session` to set cookie
3. Trigger auth-refresh event and show success toast
4. Stop polling after 5 minutes (timeout)

---

### Translation Keys

#### [MODIFY] [en.json](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/i18n/en.json) & [zh.json](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/i18n/zh.json)

Add keys for new UX states:

- `waitingForTelegramLogin` - "Waiting for you to complete login in Telegram..."
- `loginSuccessful` - "Login successful!"

---

## Verification Plan

### Manual Testing (Primary)

1. **Start the dev server**: `npm run dev`
2. **Open the app** in Chrome at `http://localhost:3000`
3. **Click "Login with Telegram"** in the login modal
4. **In Telegram**: Click "Start" in the bot chat
5. **In Telegram**: Click "Complete Login" button
6. **Observe**:
   - Telegram's browser should show "Login Complete" success page
   - Original Chrome browser should automatically detect login and show success toast
   - User should be logged in (check avatar in header)
7. **Verify cookie**: Open DevTools → Application → Cookies → Confirm `luxecuts_session` cookie exists

### TypeScript Check

```bash
npx tsc --noEmit
```

### Database Migration (if needed)

Since the `status` column has a default value, existing tokens will work. No migration script required—Drizzle will handle it on next push:

```bash
npx drizzle-kit push
```

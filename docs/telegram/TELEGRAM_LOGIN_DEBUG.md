# Telegram Login Authentication - Debugging Guide

## Problem

Users clicking "Complete Login" link from Telegram bot were getting "Authentication failed" errors. Server logs showed: `[VERIFY-LOGIN] FAILED: Token not found in database`

## Root Cause Analysis

The Telegram login flow has 5 steps:

1. **Frontend**: User clicks "Login with Telegram" → calls `/api/auth/telegram/start-login`
2. **Backend**: Creates token in database → returns token to frontend
3. **Frontend**: Opens `https://t.me/bot?start=login_{token}`
4. **Telegram**: User clicks "Start" → Telegram sends webhook `/start login_{token}`
5. **Backend Webhook**:
   - Finds/creates user
   - Updates token with userId
   - Sends "Complete Login" link
6. **User**: Clicks "Complete Login" → calls `/api/auth/telegram/verify-login?token={token}`
7. **Backend**: Verifies token, creates session, logs in user

**The failure point**: Step 6 couldn't find the token that was created in step 2.

## Fixes Implemented

### 1. Error Message Mappings (AppShell.tsx)

**Before**: Generic "Authentication failed" for all errors  
**After**: Specific messages for each error code:

- `missing_token`: "Login link is missing authentication token"
- `invalid_or_expired_token`: "Login link is invalid or has expired"
- `token_expired`: "Login link has expired. Please try logging in again"
- `user_not_found`: "User account not found. Please contact support"
- `login_failed`: "Login failed. Please try again or contact support"

### 2. Token Expiry Fix (start-login route)

**Before**: 5-minute token expiry (mismatched with "10 minutes" message to user)  
**After**: 10-minute token expiry (matches user-facing message)

### 3. Enhanced Logging

#### start-login route

```
[START-LOGIN] Generating new login token...
[START-LOGIN] Token generated (redacted): abc123...
[START-LOGIN] Expires at: 2025-11-04T04:00:00.000Z
[START-LOGIN] Token saved to database with ID: 123
[START-LOGIN] Cleaned up 2 expired tokens
```

#### webhook route (handleLoginCommand)

```
[WEBHOOK] Detected /start command with parameter
[WEBHOOK] Start parameter: login_abc123...
[LOGIN-WEBHOOK] Starting login command handler
[LOGIN-WEBHOOK] ChatId: 123456789
[LOGIN-WEBHOOK] Token (redacted): abc123...
[LOGIN-WEBHOOK] Token found, checking expiry...
[LOGIN-WEBHOOK] Token valid, creating/finding user...
[LOGIN-WEBHOOK] User created/found: user-id-123
[LOGIN-WEBHOOK] Updating token with userId...
[LOGIN-WEBHOOK] Token updated successfully
[LOGIN-WEBHOOK] Sending complete login link to user...
[LOGIN-WEBHOOK] SUCCESS: Login flow completed
```

#### verify-login route

```
[VERIFY-LOGIN] Starting verification process
[VERIFY-LOGIN] Token received (redacted): abc123...
[VERIFY-LOGIN] Token full length: 43
[VERIFY-LOGIN] Querying database for token...
[VERIFY-LOGIN] Total tokens in database: 3
[VERIFY-LOGIN] Token prefixes: [{prefix: "abc123...", userId: "user-123", expired: false}]
[VERIFY-LOGIN] Token found in database, checking expiry...
[VERIFY-LOGIN] Token expires at: 2025-11-04T04:00:00.000Z
[VERIFY-LOGIN] Current time: 2025-11-04T03:55:00.000Z
[VERIFY-LOGIN] Token not expired, checking userId...
[VERIFY-LOGIN] UserId found: user-id-123
[VERIFY-LOGIN] Looking up user in database...
[VERIFY-LOGIN] User found: {id: "user-123", name: "John Doe", authProvider: "telegram"}
[VERIFY-LOGIN] Setting session cookie...
[VERIFY-LOGIN] Deleting used token...
[VERIFY-LOGIN] SUCCESS: Redirecting to app with login=success
```

### 4. Robust Error Handling (webhook)

**Before**: If user creation or token update failed, "Complete Login" link was still sent  
**After**:

- User creation wrapped in try-catch → sends error message if fails
- Token update wrapped in try-catch → prevents "Complete Login" link if fails
- Each failure sends specific error message to user

## Debugging Next Steps

### What to Check in Logs

1. **Is the webhook receiving /start commands?**
   - Look for: `[WEBHOOK] Detected /start command with parameter`
   - If missing: Webhook not configured or Telegram not sending updates

2. **Is the token being created?**
   - Look for: `[START-LOGIN] Token saved to database with ID: ...`
   - If missing: Database connection issue or Drizzle error

3. **Is the webhook finding the token?**
   - Look for: `[LOGIN-WEBHOOK] Token found, checking expiry...`
   - If missing but webhook received: Token not in database (race condition?)

4. **Is the token being updated with userId?**
   - Look for: `[LOGIN-WEBHOOK] Token updated successfully`
   - If missing: User creation failed or database update failed

5. **Is verify-login finding the token?**
   - Look for: `[VERIFY-LOGIN] Total tokens in database: X`
   - Compare token prefixes to see if the token exists

### Common Failure Scenarios

#### Scenario A: Webhook Never Receives /start

**Symptoms**:

- `[START-LOGIN]` logs present
- No `[WEBHOOK] Detected /start` logs
- `[VERIFY-LOGIN]` shows token not found

**Possible Causes**:

- Telegram webhook not configured
- Webhook URL incorrect
- Bot not reachable
- User didn't click "Start" in Telegram

**Fix**: Run `node scripts/setup-telegram-webhook.js`

#### Scenario B: Token Created But Not Found

**Symptoms**:

- `[START-LOGIN]` shows token created
- `[VERIFY-LOGIN]` shows 0 tokens or different tokens
- No `[LOGIN-WEBHOOK]` logs

**Possible Causes**:

- Token deleted prematurely by cleanup
- Multiple database instances (dev/prod confusion)
- Token encoding issue (base64url)

**Fix**: Check `[VERIFY-LOGIN] Token prefixes` to see what tokens exist

#### Scenario C: Webhook Fails to Update Token

**Symptoms**:

- `[LOGIN-WEBHOOK]` shows "FAILED: Error updating token"
- `[VERIFY-LOGIN]` shows token exists but has no userId

**Possible Causes**:

- Database constraint violation
- Drizzle unique constraint error
- Network issue during update

**Fix**: Check webhook error logs for specific Drizzle error

#### Scenario D: User Creation Fails

**Symptoms**:

- `[LOGIN-WEBHOOK]` shows "FAILED: Error creating/finding user"
- "Complete Login" link not sent

**Possible Causes**:

- Email/username constraint violation
- Invalid data from Telegram
- Database schema issue

**Fix**: Check specific error in logs, may need to clean up duplicate users

## Testing the Fix

1. **Clear existing tokens** (optional):

   ```sql
   DELETE FROM "LoginToken";
   ```

2. **Attempt login**:
   - Click "Login with Telegram"
   - Watch logs for `[START-LOGIN]` logs
   - Click "Start" in Telegram
   - Watch logs for `[WEBHOOK]` and `[LOGIN-WEBHOOK]` logs
   - Click "Complete Login"
   - Watch logs for `[VERIFY-LOGIN]` logs

3. **Expected successful flow**:
   ```
   [START-LOGIN] Token saved to database with ID: 1
   [WEBHOOK] Detected /start command with parameter
   [LOGIN-WEBHOOK] Token updated successfully
   [VERIFY-LOGIN] SUCCESS: Redirecting to app with login=success
   ```

## Code Changes Summary

- `src/components/AppShell.tsx`: Added 5 error message mappings
- `src/app/api/auth/telegram/start-login/route.ts`: Added logging, changed expiry to 10min
- `src/app/api/auth/telegram/verify-login/route.ts`: Added comprehensive logging + token list query
- `src/app/api/telegram/webhook/route.ts`: Added logging + error handling in handleLoginCommand

All changes are backward compatible and only add logging/error handling.

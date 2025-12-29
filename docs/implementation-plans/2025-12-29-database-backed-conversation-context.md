# Implementation Plan: Database-Backed Conversation Context

## Problem Statement

Users experience **context loss** during multi-step Telegram bot flows (booking, reschedule, cancel). The current implementation stores conversation state in an **in-memory JavaScript object** (`bookingContexts: Record<string, BookingContext>`), which is:

1. **Volatile in serverless/edge environments** - Each function invocation may run on a different instance
2. **Lost on server restarts** - Development or production deployments reset state
3. **Not shared across workers** - When deployed to Cloudflare Workers or Vercel Edge, each worker has its own memory

---

## Root Cause Analysis

### Current Architecture

```
     ┌─────────────────────────────────────────────────────────────────┐
     │  conversationHistory.ts                                         │
     ├─────────────────────────────────────────────────────────────────┤
     │  const bookingContexts: Record<string, BookingContext> = {}     │  ◄── IN-MEMORY (volatile)
     │  const history: Record<string, ...> = {}                        │  ◄── IN-MEMORY (volatile)
     │  const lastActivity: Record<string, number> = {}                │  ◄── IN-MEMORY (volatile)
     │                                                                 │
     │  EXCEPTION: flagConversation() uses DATABASE                    │  ◄── PERSISTENT (works!)
     └─────────────────────────────────────────────────────────────────┘
```

### Evidence

- `conversationHistory.ts` lines 71-73: In-memory storage
- `conversationHistory.ts` lines 163-325: Database-backed flagging (working pattern)
- `botCommandService.ts`: ~15 calls to `getBookingContext()`, returns `null` when context lost

---

## Proposed Solution

### 1. Create New Database Table: `conversation_sessions`

```sql
CREATE TABLE conversation_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,                      -- Telegram chat ID or user identifier
  platform TEXT NOT NULL DEFAULT 'telegram',  -- 'telegram' or 'whatsapp'
  context JSONB NOT NULL DEFAULT '{}',        -- BookingContext serialized as JSON
  last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,              -- 30 minutes from last activity
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX conversation_sessions_user_platform_idx
  ON conversation_sessions(user_id, platform);

CREATE INDEX conversation_sessions_expires_idx
  ON conversation_sessions(expires_at);
```

---

### 2. Proposed Changes

#### [NEW] `drizzle/migrations/0001_conversation_sessions.sql`

Migration to create `conversation_sessions` table

---

#### [MODIFY] `src/db/schema.ts`

Add new table definition for `conversationSessions`

---

#### [MODIFY] `src/services/conversationHistory.ts`

**Key Changes:**

1. Replace in-memory `bookingContexts` with database calls
2. Add in-memory cache with short TTL (for performance within same request)
3. Make `setBookingContext` and `getBookingContext` async
4. Update expiry on every activity (sliding window)

| Function              | Current         | New                     |
| --------------------- | --------------- | ----------------------- |
| `getBookingContext`   | sync, in-memory | async, database         |
| `setBookingContext`   | sync, in-memory | async, database + cache |
| `clearBookingContext` | sync, in-memory | async, database         |
| `pushStep`            | sync, in-memory | async, database         |
| `popStep`             | sync, in-memory | async, database         |
| `clearStepHistory`    | sync, in-memory | async, database         |

---

#### [MODIFY] `src/services/botCommandService.ts`

Add `await` to all `getBookingContext()` and `setBookingContext()` calls (~30 locations)

---

#### [MODIFY] `src/app/api/telegram/webhook/route.ts`

Update `sendCommandResponse` to use async context storage

---

#### [MODIFY] `src/services/messagingUserService.ts`

Update to use async context functions

---

## User Review Required

> [!IMPORTANT]
> **Breaking Change**: `getBookingContext()` and `setBookingContext()` will become async functions. All callers must be updated to use `await`.

> [!WARNING]
> **Migration Required**: New database table `conversation_sessions` must be created before deploying the code changes.

---

## Verification Plan

### Automated Tests

1. Run existing agent tests: `npm test`
2. Run type checking: `npx tsc --noEmit`

### Manual Testing

Follow `docs/telegram/TELEGRAM_TESTING_GUIDE.md`:

1. Booking flow end-to-end
2. Context persistence across delays (wait 5 min, continue)
3. Back button navigation
4. Multiple concurrent users

---

## Implementation Order

1. Create migration file
2. Run migration: `npx drizzle-kit push`
3. Update `schema.ts`
4. Update `conversationHistory.ts`
5. Update `botCommandService.ts`
6. Update `webhook/route.ts`
7. Type check & test

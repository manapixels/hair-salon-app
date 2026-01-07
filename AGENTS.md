# AGENTS.md

**Signature Trims AI Agents** - Comprehensive guide to AI/bot systems powering automated booking, customer engagement, and retention.

---

## 🤖 Agent Architecture Overview

The system uses a **tiered approach** to handle user interactions, prioritizing speed and reliability:

1.  **Level 1: Intent Parser (Deterministic)** - _Highest Priority_
    - **Role**: Handles all booking flows with actual API calls: book, view, cancel, reschedule.
    - **Behavior**: Rule-based, deterministic, calls DB functions directly.
    - **Handled Intents**: `book`, `confirmation`, `view_appointments`, `cancel`, `reschedule`, `greeting`, `services`, `hours`, `help`.
    - **Fallback**: If confidence < 0.7 or unhandled intent, passes to Level 2.

2.  **Level 2: Gemini AI Service (LLM)** - _Secondary / Smart Fallback_
    - **Role**: Handles complex queries, natural language reasoning, and ambiguity.
    - **Behavior**: Generative, context-aware, higher latency.
    - **Examples**: "Book with May for next Monday", "Do you have parking?", "I want to speak to a human".

```
Incoming Message
    │
    ▼
[Intent Parser] ──(Matched?)──▶ [Execute Command] ──▶ Reply
    │
    │ (No Match)
    ▼
[Gemini AI] ──────▶ [Function Call] ──▶ [DB] ──▶ Reply
```

---

## 🧭 Navigation Configuration (`src/config/navigation.ts`)

### **Purpose**

Single source of truth for service navigation links, titles, and associated images across the application.

### **Usage**

```typescript
import { SERVICE_LINKS } from '@/config/navigation';

// Use in components
{SERVICE_LINKS.map(service => (
  <Link href={service.href}>{service.title}</Link>
))}
```

---

## 🏗️ Site Layout & Components

### **Header (`AppHeader.tsx`)**

- **Mental Model**: Desktop = Mega Menu + Actions; Mobile = Drawer.
- **Social Links**: Desktop header includes direct icon links to Instagram, Facebook, WhatsApp.
- **Roles**: Context-aware buttons (Admin Panel vs Customer Dashboard).

### **Footer (`AppFooter.tsx`)**

- **Dynamic Content**: Fetches business info (address, hours) from Admin Settings.
- **Social**: Dedicated column for social connections.

---

## 📱 Mobile UX Guidelines

### **Interaction Philosophy**

Touch devices lack a true "hover" state. Tapping an element can cause "sticky" hover styles that persist until another interaction occurs, leading to a confusing user experience.

### **Rules**

1.  **No Hover on Touch**: Disable hover effects on devices that don't support a pointing device (mouse).
2.  **Explicit Feedback**: Use `:active` states to provide immediate visual feedback during a tap.

### **Implementation Strategy**

1.  **Global Config**: Enable `hoverOnlyWhenSupported` in `tailwind.config.ts`.
    ```typescript
    future: {
      hoverOnlyWhenSupported: true,
    }
    ```
2.  **Component Styling**:
    - **Avoid**: `hover:bg-primary` (unless wrapped in media query)
    - **Prefer**: `active:scale-95` (via `.active-scale` utility) or `active:bg-gray-100`.
    - **Utility**: `src/styles/globals.css` defines `.active-scale`.

---

## 💰 No-Show Protection (Deposits)

First-time customers (0 completed visits) must pay a deposit to secure their booking.

### **Key Files**

| File                                                      | Purpose                    |
| --------------------------------------------------------- | -------------------------- |
| `src/services/paymentService.ts`                          | HitPay API integration     |
| `src/inngest/depositFunctions.ts`                         | Auto-cancel, daily summary |
| `src/components/admin/settings/salon/DepositSettings.tsx` | Admin config               |

### **Settings** (Admin Dashboard → Deposits)

- `depositEnabled` - Toggle deposit requirement
- `depositPercentage` - Default 15%
- `depositTrustThreshold` - Visits before trusted (default 1)
- `depositRefundWindowHours` - Cancellation deadline (default 24)

### **Flow**

1. First-timer books → Create PENDING deposit
2. Redirect to HitPay payment (Web) or show link (Telegram)
3. If paid → Appointment confirmed
4. If unpaid after 2hr → Auto-cancel + notify customer

### **Env Variables**

```bash
HITPAY_API_KEY=your_api_key
HITPAY_SALT=your_webhook_salt
```

---

## 👤 Multi-Role User System

Users can have multiple roles simultaneously (e.g., a stylist who is also an admin).

> [!NOTE]
> The deprecated `role` column has been removed. Only `roles` array is used.

### **Key Files**

- **`src/lib/roleHelpers.ts`** - Role check utilities (`isAdmin`, `isStylist`, `isCustomer`, `hasStylistAccess`, `getPrimaryRole`)
- **`src/db/schema.ts`** - `roles` text array column on users table
- **`src/types.ts`** - `Role` type and `User` interface with `roles: Role[]`

### **Usage Pattern**

```typescript
import { isAdmin, isStylist, hasStylistAccess, getPrimaryRole } from '@/lib/roleHelpers';

// Check if user has admin access
if (isAdmin(user)) {
  /* admin-only logic */
}

// Check if user can access stylist features (STYLIST or ADMIN)
if (hasStylistAccess(user)) {
  /* stylist features */
}

// Get primary role for display
const displayRole = getPrimaryRole(user); // 'ADMIN' | 'STYLIST' | 'CUSTOMER'
```

### **Data Integrity Validation**

Users with `STYLIST` role must have a corresponding record in the `stylists` table.

- **Validate**: `GET /api/admin/data-integrity/check` - Checks for orphaned role/record mismatches
- **Function**: `validateRoleStylistConsistency()` in `src/lib/database.ts`

> [!TIP]
> Always use the admin "Promote to Stylist" flow to create stylists, as it creates both the role AND stylist record.

### **Role-Based Routing Architecture**

The app has **separate dashboard experiences** for admins and stylists:

| Route        | Layout                  | Access          | Component                                 |
| ------------ | ----------------------- | --------------- | ----------------------------------------- |
| `/admin/*`   | `AdminLayout` (sidebar) | `isAdmin(user)` | Full admin panel                          |
| `/dashboard` | Basic page (no sidebar) | Logged-in users | `StylistDashboard` or `CustomerDashboard` |

**Key routing files:**

- **`src/app/[locale]/admin/layout.tsx`** - Admin auth guard, wraps children in `AdminLayout`
- **`src/app/[locale]/dashboard/page.tsx`** - Switches between `StylistDashboard` / `CustomerDashboard` based on `hasStylistAccess(user)`
- **`src/components/admin/AdminLayout.tsx`** - Admin shell with sidebar navigation
- **`src/components/admin/AdminNavigation.tsx`** - Admin sidebar nav items (11 sections)
- **`src/components/views/StylistDashboard.tsx`** - Stylist profile, Google Calendar, personal appointments
- **`src/components/layout/AppHeader.tsx`** - Header with role-based nav buttons

**Admin Navigation Sections:**

- Quick Glance: Dashboard
- Bookings: Appointments, Availability
- People: Stylists, Customers
- Support: Chat, Knowledge Base
- Settings: Business Info, Operating Hours, Closures, Services

**Admin+Stylist users:** Can access "My Stylist Profile" link in admin sidebar to view stylist-specific features (Google Calendar, personal appointments) without leaving the admin panel.

---

## 💾 Database Layer (Drizzle ORM)

### **Overview**

Database access uses **Drizzle ORM** with `@neondatabase/serverless` for edge-compatible HTTP connections. Optimized for Cloudflare Workers with Hyperdrive connection pooling. Next.js 14 caching layer using `unstable_cache` with tag-based revalidation for faster page loads.

**Performance**: Instant page loads for service listings, reduced database queries, edge-compatible.

### **Key Files**

- **`src/db/schema.ts`** - Drizzle table definitions, enums, and relations
- **`src/db/index.ts`** - Database connection factory (`getDb()`) with Hyperdrive support
- **`src/lib/database.ts`** - Business logic functions (cached queries, CRUD operations)
- **`src/lib/actions/services.ts`** - Server Actions with cache revalidation
- **`drizzle.config.ts`** - Drizzle Kit configuration for migrations

### **Connection Setup**

```typescript
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

const db = await getDb();
const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
```

- **Cloudflare**: Uses `getCloudflareContext().env.HYPERDRIVE.connectionString`
- **Local/Vercel**: Uses `DATABASE_URL` environment variable

### **How Caching Works**

1. **Cached Queries**: Functions wrapped with `unstable_cache` using cache tags (`'services'`, `'service-categories'`, `'service-{id}'`)
2. **Mutations**: Server Actions update database then call `revalidateTag()` to invalidate affected caches
3. **Strategy**: On-demand revalidation (`revalidate: false`) - caches persist until explicitly invalidated

### **Cache Invalidation Patterns**

| Operation                    | Invalidated Tags                                                         |
| ---------------------------- | ------------------------------------------------------------------------ |
| Create/Update/Delete Service | `services`, `service-{id}`, `service-categories`                         |
| Update Category              | `service-categories`, `category-{id}`                                    |
| Update Service Tags          | `services`, `service-{id}`, `service-categories`                         |
| Book/Cancel Appointment      | `availability`, `availability-{date}`, `availability-{stylistId}-{date}` |

### **Availability Caching**

The `getAvailability` and `getStylistAvailability` functions use `unstable_cache` with:

- **30-second TTL**: Short fallback TTL for safety
- **Tag-based revalidation**: Instantly invalidated when bookings are created/cancelled
- **Fine-grained keys**: Date and stylist-specific cache keys prevent over-invalidation

Cache is automatically revalidated in `bookNewAppointment()` and `cancelAppointment()` via `revalidateAvailability()`.

### **Duration-Based Filtering**

The `/api/availability` endpoint accepts an optional `duration` parameter (in minutes). When provided, the API filters out time slots that don't have enough consecutive 30-minute blocks to accommodate the service. This prevents users from selecting times that would fail at booking due to insufficient time before closing or another appointment.

### **Concurrent Scheduling (Processing Gaps)**

Services with chemical processing (colouring, perms, rebonding, keratin) can define "gaps" where the stylist is free to take other clients:

- **`processingWaitTime`**: Minutes from start until the gap begins (e.g., application time)
- **`processingDuration`**: Minutes the stylist is free during processing

**Example**: A 2-hour colour service booked at 10:00 with `processingWaitTime=45` and `processingDuration=45`:

- **10:00** slot: Blocked (application)
- **10:30** slot: Blocked (application continues)
- **11:00** slot: **FREE** ✅ (colour developing - can book a haircut here!)
- **11:30** slot: Blocked (rinse/finish)

Configure via Admin → Settings → Services → Edit service → Processing Wait Time / Gap Duration.

### **Critical Notes for Developers**

⚠️ **Use `getDb()` for database access** - Always import from `@/db`, never instantiate clients directly

⚠️ **Use Server Actions from `src/lib/actions/services.ts`** - They handle cache invalidation

⚠️ **Cache tags must match** between `database.ts` and `actions/services.ts`

⚠️ **HTTP driver limitations**: No transactions with the HTTP driver; use sequential operations

---

## 🧠 1. Gemini AI Service (`src/services/geminiService.ts`)

### **Purpose**

Natural language understanding for booking flows. Converts user messages into structured function calls.

### **Function Declarations**

| Function                | Description                     | Parameters                                                 |
| ----------------------- | ------------------------------- | ---------------------------------------------------------- |
| `getServicesList`       | Fetch available services/prices | None                                                       |
| `checkAvailability`     | Check slots for date            | `date` (YYYY-MM-DD)                                        |
| `bookAppointment`       | Create new booking              | `name`, `email`, `services[]`, `date`, `time`, `stylistId` |
| `cancelAppointment`     | Cancel existing appointment     | `email`, `date`, `time`                                    |
| `listMyAppointments`    | Get user's appointments         | `email`                                                    |
| `rescheduleAppointment` | Change appointment datetime     | `email`, `oldDate`, `oldTime`, `newDate`, `newTime`        |

### **Usage Pattern**

```typescript
// User message → Gemini → Function call → DB operation → Response
const response = await ai.generateContent({
  messages: conversationHistory,
  tools: [{ functionDeclarations }],
});

if (response.functionCall) {
  const result = await executeFunctionCall(response.functionCall);
  // Return structured response to user
}
```

### **Key Features**

- ✅ Multi-turn conversation support
- ✅ Context-aware responses
- ✅ Automatic service name matching
- ✅ Handles ambiguity with clarifying questions
- ✅ User-friendly datetime formatting (`formatDisplayDate`, `formatTime12Hour`)

### **Integration Points**

- **WhatsApp Chat**: `/api/chat` endpoint
- **Telegram Bot**: Inline queries, natural language commands
- **Database**: Direct read/write via `src/lib/database.ts`
- **Messaging**: Auto-confirmations via `messagingService.ts`
- **Fallback**: `intentParser.ts` for deterministic parsing when Gemini unavailable

---

## 🔍 1b. Intent Parser (`src/services/intentParser.ts`)

### **Purpose**

Deterministic fallback parser for when Gemini AI is unavailable. Parses user messages using keyword matching, natural language date/time parsing, stylist matching, and category matching.

### **Key Features**

- ✅ **Stylist matching**: "with May", "by Sarah", auto-assigns single stylist
- ✅ **40+ booking phrases**: "I'd like to get", "can I schedule", "gonna get"
- ✅ **Date parsing**: "tomorrow", "next Friday", "Dec 12"
- ✅ **Time parsing**: "2pm", "afternoon", "3:30"
- ✅ **Negation detection**: "don't want", "never mind" invalidates intent
- ✅ **Category keywords**: Maps "frizz" → Keratin, "bang trim" → Haircut

### **Usage**

```typescript
import { parseMessage, generateFallbackResponse } from './intentParser';

// Parse user message
const parsed = await parseMessage('Book keratin with May at 2pm Friday');
// → { type: 'book', category: {...}, date: {...}, time: {...}, stylistId: '...', stylistName: 'May' }

// Generate response when Gemini unavailable
const response = await generateFallbackResponse(message, currentContext);
```

---

## 📱 2. Telegram Bot (`src/services/botCommandService.ts`)

### **Purpose**

Command-based interface for booking, viewing, and managing appointments via Telegram.

### **Bot Commands**

| Command       | Description             | Flow                         |
| ------------- | ----------------------- | ---------------------------- |
| `/start`      | Initialize bot session  | Welcome + main menu          |
| `/book`       | Start booking flow      | Service → Stylist → DateTime |
| `/myappts`    | List user appointments  | Upcoming + past appointments |
| `/cancel`     | Cancel appointment      | Select appointment → Confirm |
| `/reschedule` | Change appointment      | Select appt → New datetime   |
| `/help`       | Show available commands | Command list                 |

### **Conversation Flow**

```
/book
  ↓
Select Service (multi-select supported)
  ↓
Select Stylist (filtered by service)
  ↓
Select Date (calendar picker)
  ↓
Select Time (available slots only)
  ↓
Confirm Booking
  ↓
Confirmation Message (WhatsApp/Telegram)
```

### **State Management**

- Uses `conversationHistory.ts` for multi-step flows
- **Database-backed**: Conversation context persisted to `conversation_sessions` table
- Functions are **async**: `getBookingContext()`, `setBookingContext()`, `pushStep()`, etc.
- Tracks: `userId`, `currentStep`, `selectedServices`, `selectedDate`, `selectedTime`
- Session timeout: 30 minutes of inactivity (sliding window)
- In-memory cache (30s TTL) for same-request performance

### **Best Practices**

- ✅ **Back button navigation** - Every step has "← Back" option
- ✅ **Input validation** - Real-time availability checks
- ✅ **Error recovery** - Clear messages + retry options
- ✅ **Confirmation steps** - Always confirm before booking/canceling
- ✅ **Helpful error messages** - CRITICAL UX:
  1. **Explain the situation** - Tell users WHY something failed
  2. **Suggest a resolution** - Help users achieve their objective
  - Bad: "Booking conflict. Not enough consecutive slots."
  - Good: "Hair perming usually requires 3 hours. Our salon closes at 7pm, is 4pm ok?"
- ✅ **Pre-validate before confirmation** - Never show "Ready to Book?" if the slot isn't viable
- ✅ **Compound message handling** - Extract embedded info from confirmation phrases
  - Example: "4:30pm sounds good" → Extract time THEN confirm
  - Intent parser detects "sounds good" as confirmation, but also parses "4:30pm"
- ✅ **Intent priority system** - Specific intents take precedence:
  - cancel/reschedule (10) > view_appointments (9) > confirmation (8) > book (5) > greeting (3)
  - Prevents "highlights" matching "hi" as greeting
- ✅ **Past date validation** - Checks date at all steps, not just final confirmation
- ✅ **Test suite** (`src/tests/intent-parser-test-cases.ts`) - 65 tests, 100% pass rate
  - Stateless parsing (46 tests)
  - Multi-step flows (14 tests)
  - Error recovery (3 tests)
  - Edge cases (2 tests)

### **Setup**

```bash
# Set webhook (production)
node scripts/setup-telegram-webhook.js

# Test commands
See ../telegram/TELEGRAM_TESTING_GUIDE.md
```

### **Telegram Login (Cross-Browser)**

Login uses polling to ensure cookies are set in the **original browser**, not Telegram's in-app browser:

1. Original browser generates token → opens Telegram deep link (with locale encoded)
2. Original browser polls `check-login-status` every 2s
3. User completes login in Telegram → `verify-login` marks token `COMPLETED`
4. Original browser detects completion → calls `claim-session` to set cookie

**Localization**: The login complete page (`verify-login`) is localized via `locale` URL param. Supported: `en`, `zh`.

**iOS Deep Links**: Uses `tg://` scheme (native) for iOS because Universal Links (`t.me`) are inconsistent. Falls back to `t.me` if app not installed.

**Key files**: `src/app/api/auth/telegram/` (check-login-status, claim-session, verify-login, start-login), `TelegramLoginWidget.tsx`

---

## 🗣️ 3. WhatsApp Chat (`src/components/WhatsAppChat.tsx`)

### **Purpose**

Web-based chat widget using Gemini AI for natural language booking.

### **Features**

- Real-time conversation with AI
- Service recommendations
- Availability checking
- Multi-service bookings
- Appointment management

### **Usage Flow**

```
User: "I need a haircut tomorrow at 2pm"
  ↓
AI: [checkAvailability] → [bookAppointment]
  ↓
AI: "Confirmed for 18 Oct 2025, 2pm with Sarah"
```

### **Integration**

- **API**: `/api/chat` (POST)
- **AI Service**: `geminiService.ts`
- **Auth**: Optional - links bookings to user if logged in

---

## 🧩 4. NLU Helpers (`src/agents/nlu/`)

### **Purpose**

Utility functions for parsing user input. **Not** separate AI agents.

### **Service Aliases** (`serviceAliases.ts`)

```typescript
const SERVICE_ALIASES = {
  haircut: "Men's Haircut",
  'mens cut': "Men's Haircut",
  trim: "Men's Haircut",
  'womens haircut': "Women's Haircut",
  color: 'Single Process Color',
  highlights: 'Partial Highlights',
  blowout: 'Blowout',
  'blow dry': 'Blowout',
};
```

**Usage**: Internal only - maps user utterances to canonical service names.

### **DateTime Extraction** (Planned)

```typescript
import * as chrono from 'chrono-node';

extractDateTime('tomorrow 3pm');
// → { date: Date, time: "15:00" }
```

---

## 📬 5. Retention Engine

### **Purpose**

Automated messaging for feedback, rebooking, and win-back campaigns.

### **Message Types**

| Type                 | Trigger                   | Timing          | Rate Limit       |
| -------------------- | ------------------------- | --------------- | ---------------- |
| **Feedback Request** | Appointment completed     | +4 hours        | Once per booking |
| **Rebooking Nudge**  | No appointment in 4 weeks | Weekly check    | Max 1/week       |
| **Win-Back**         | No appointment in 8 weeks | Weekly check    | Max 1/week       |
| **Reminder**         | Upcoming appointment      | 24 hours before | Once per booking |

### **Services**

#### **Reminder Service** (`src/services/reminderService.ts`)

- Sends 24-hour reminders via WhatsApp/Telegram
- Triggered by GitHub Actions cron
- Endpoint: `/api/reminders/send`

#### **Messaging Service** (`src/services/messagingService.ts`)

- Unified interface for WhatsApp + Telegram
- Auto-selects channel based on user's auth provider
- Functions:
  - `sendAppointmentConfirmation()`
  - `sendAppointmentReminder()`
  - `sendCancellationConfirmation()`
  - `sendRescheduleConfirmation()`

#### **Calendar Reminder Service** (`src/services/calendarReminderService.ts`)

- Sends daily reminders to stylists when their Google Calendar token expires
- Sends success notification when calendar is reconnected
- Rate limited to 1 reminder per stylist per day
- Endpoint: `/api/calendar-reminders/send`
- Database fields on `stylists` table:
  - `googleTokenInvalid` - Flag set when token refresh fails
  - `lastCalendarReminderSent` - Rate limiting timestamp

#### **Google Calendar Library** (`src/lib/google.ts`)

Cloudflare Workers compatible implementation using native `fetch` API and Web Crypto API:

- **Token Refresh**: Uses `fetch` to refresh OAuth tokens
- **Service Account JWT**: Uses Web Crypto `RSASSA-PKCS1-v1_5` for JWT signing
- **Calendar CRUD**: Uses `fetch` for create/update/delete events

> [!NOTE]
> The `googleapis` library was removed because it uses Node.js `https` module which is not available in Cloudflare Workers runtime.

#### **Retention Services**

- `retentionService.ts` - Identifies users for rebooking/winback
- `retentionMessageService.ts` - Message templates + delivery

### **Configuration** (Planned - `src/config/retention.ts`)

```typescript
export const RETENTION_CONFIG = {
  feedback: { delayHours: 4 },
  rebooking: { weeksSinceVisit: 4 },
  winback: { weeksSinceVisit: 8 },
  rateLimit: { daysBetweenMessages: 7 },
};
```

### **Database Schema** (Drizzle)

```typescript
export const retentionMessages = pgTable('retention_messages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull(),
  messageType: retentionMessageTypeEnum('messageType').notNull(),
  daysSinceLastVisit: integer('daysSinceLastVisit').notNull(),
  sentAt: timestamp('sentAt').defaultNow().notNull(),
  deliveryStatus: text('deliveryStatus').default('PENDING'), // SENT/FAILED/REPLIED
  deliveryError: text('deliveryError'),
});

export const retentionMessageTypeEnum = pgEnum('RetentionMessageType', [
  'FEEDBACK_REQUEST',
  'REBOOKING_NUDGE',
  'WIN_BACK',
]);

export const bookingSourceEnum = pgEnum('BookingSource', ['WEB', 'TELEGRAM', 'WHATSAPP']);
// Used in appointments table to track booking origin
```

---

## 🔧 Environment Variables

```bash
# AI & Messaging
GEMINI_API_KEY=your_gemini_api_key
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Cloudflare R2 (Avatar Storage)
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev

# HitPay Payment Gateway (Deposits)
HITPAY_API_KEY=your_hitpay_api_key
HITPAY_SALT=your_webhook_salt

# Optional: WhatsApp Business Phone ID
   const newFunction: FunctionDeclaration = {
     name: 'functionName',
     description: 'Clear description for AI',
     parameters: {
       type: Type.OBJECT,
       properties: {
         /* ... */
       },
       required: ['param1', 'param2'],
     },
   };
```

2. **Implement Handler**

   ```typescript
   case 'functionName':
     const result = await yourDbFunction(args);
     return formatResponseForUser(result);
   ```

3. **Add to Function Registry**
   ```typescript
   tools: [{ functionDeclarations: [..., newFunction] }]
   ```

### **Adding Bot Commands**

1. **Register Command** (Telegram BotFather)

   ```
   /setcommands → Add new command + description
   ```

2. **Implement Handler** (`botCommandService.ts`)

   ```typescript
   case '/newcommand':
     await handleNewCommand(chatId, userId);
     break;
   ```

3. **Update Help Menu**
   ```typescript
   case '/help':
     // Add new command to list
   ```

### **Message Template Guidelines**

✅ **DO:**

- Use `formatDisplayDate()` for dates → "18 Oct 2025"
- Use `formatTime12Hour()` for times → "2pm", "2:30pm"
- Include emojis for visual clarity
- Provide clear CTAs (Call-to-Action)
- Add unsubscribe options for retention messages
- Fallback for empty service names

❌ **DON'T:**

- Show technical formats (ISO strings, HH:MM)
- **Show prices in confirmation messages** (Privacy/Simplicity)
- Send without rate limiting
- Block user flow during sending
- Forget error handling + retries

### **Testing AI Agents**

```bash
# Unit tests (when implemented)
npm test -- geminiService.test.ts

# Manual testing
# Telegram: See ../telegram/TELEGRAM_TESTING_GUIDE.md
# WhatsApp: Use test business account

# Reminder testing
curl -X POST http://localhost:3000/api/reminders/test
```

### **Build & Type Checking**

⚠️ **Important**: Avoid using `npm run build` for quick type checks.

- It is slow and resource-intensive.
- **CRITICAL**: It deletes/modifies the `.next` folder, which **crashes any running `npm run dev` server**, forcing a restart.

```bash
# ❌ DON'T: Slow full build (takes 30+ seconds)
npm run build

# ✅ DO: Fast TypeScript type checking only (takes 5-10 seconds)
npx tsc --noEmit

# ✅ DO: ESLint for linting
npx eslint src/

# ✅ DO: Type check specific file
npx tsc --noEmit src/components/MyComponent.tsx
```

**When to use each**:

- **`npx tsc --noEmit`**: Quick type checking during development
- **`npm run build`**: Only before deployment or when you need production build
- **`npm run dev`**: Local development server (auto-reloads on changes)

### **Cloudflare Deployment (Alternative to Vercel)**

The app supports deployment to Cloudflare Pages with Hyperdrive for database acceleration.

**Configuration Files:**

- `wrangler.toml` - Cloudflare Workers config with Hyperdrive binding
- `open-next.config.ts` - OpenNext adapter configuration

**Build Scripts:**

```bash
# Build for Cloudflare
npm run cf:build

# Deploy to Cloudflare
npm run cf:deploy

# Create Hyperdrive config (first-time setup)
wrangler hyperdrive create hair-salon-db --connection-string="<NEON_URL>"
```

**Key Files for Cloudflare:**

- `src/db/index.ts` - Uses `postgres` driver (postgres.js) for Cloudflare Workers with Hyperdrive
- `src/db/schema.ts` - Drizzle schema definitions

**API Route Dynamic Exports:**

API routes that use `request.url` or `cookies` must include `export const dynamic = 'force-dynamic'` to prevent Next.js from attempting static generation during build. This eliminates build warnings and ensures proper server-side rendering.

---

## 📊 Monitoring & Metrics (Planned)

### **Key Performance Indicators**

- Booking success rate (AI vs manual)
- Function call accuracy (correct intent detection)
- Message delivery success rate
- Feedback response rate
- Rebooking conversion rate
- Win-back conversion rate

### **Error Tracking**

- Failed function calls → Log to DB
- Message delivery failures → Retry via Inngest
- Bot command errors → User-friendly error messages

---

## 🧪 Testing & Quality Assurance

### **Overview**

We maintain both automated and manual tests to ensure agent reliability. **Always update tests when adding or modifying features.**

### **Test Locations**

| Component        | Test Type     | Location                                  | Command / Guide                         |
| ---------------- | ------------- | ----------------------------------------- | --------------------------------------- |
| **Telegram Bot** | Manual        | `docs/telegram/TELEGRAM_TESTING_GUIDE.md` | Follow the guide manually               |
| **Agent Logic**  | Automated     | `src/tests/agent-evaluation.test.ts`      | `npm test`                              |
| **Scenarios**    | Manual Script | `src/tests/manual-scenarios.ts`           | `npx tsx src/tests/manual-scenarios.ts` |

### **🧪 Current Test Suites**

1.  **Agent Evaluation (`src/tests/agent-evaluation.test.ts`)**
    - Knowledge Base Search (Exact & Semantic)
    - User Pattern Recognition (Favorite service/stylist)
    - Response Accuracy (Context usage, service matching)
    - Safety & Guardrails (Inappropriate content, injection)
    - Handoff Triggers (Unknown queries)
    - Performance Metrics (Response time)

2.  **Manual Scenarios (`src/tests/manual-scenarios.ts`)**
    - Deterministic Intent Parser checks (Hours, Services, basic booking)
    - Gemini AI Logic (Complex requests, time validation)
    - Management commands (appointments list)

### **⚠️ Development Rules**

- **New Feature?** → Add a corresponding test case.
- **Bug Fix?** → Add a regression test.
- **Prompt Change?** → Verify against `agent-evaluation.test.ts` to ensure no degradation.

---

## 🚀 Future Enhancements (See `../implementation-plans/ai-agents-plan.md`)

### **Phase 1: NLU Helpers**

- [ ] DateTime extraction with `chrono-node`
- [ ] Expand service alias dictionary
- [ ] Fuzzy matching for service names

### **Phase 2: Enhanced Reminders**

- [ ] Inngest integration for reliability
- [ ] Dead letter queue for retries
- [ ] Delivery status tracking

### **Phase 3: Retention Logic**

- [ ] Automated feedback requests
- [ ] Smart rebooking suggestions (based on service history)
- [ ] Win-back campaigns with personalized offers

### **Phase 4: Analytics**

- [ ] AI conversation metrics dashboard
- [ ] Bot command usage analytics
- [ ] Retention campaign ROI tracking

---

## 🛡️ Error Handling

### **Error Boundaries**

Next.js error boundaries catch errors and display user-friendly recovery UIs instead of crashing.

| File                               | Purpose                    | Scope                                                      |
| ---------------------------------- | -------------------------- | ---------------------------------------------------------- |
| `src/app/[locale]/error.tsx`       | Route-level error boundary | Catches errors in route segments, shows retry/home buttons |
| `src/app/[locale]/admin/error.tsx` | Admin-specific errors      | Shows technical details for debugging                      |
| `src/app/global-error.tsx`         | Root layout errors         | Fallback when root layout fails (uses inline styles)       |

**Translations**: `Error.*` keys in `src/i18n/{locale}/common.json`

---

## 🔄 Flow Design Principles (Error Recovery)

When designing new user flows (booking, payments, multi-step forms), follow these principles to ensure graceful recovery from errors and interruptions.

### **1. Persist State Server-Side, Not Client-Side**

❌ **Bad**: Store flow state in React state / localStorage only
✅ **Good**: Create a pending record in the database immediately

```typescript
// Example: Deposit payment flow
// 1. User confirms booking → Create PENDING appointment + deposit in DB
// 2. Redirect to payment gateway
// 3. If user closes browser, the pending records exist for recovery
// 4. Webhook confirms payment → Update status to PAID/SCHEDULED
```

**Why**: Browser crashes, tab closes, mobile app switches – client state is volatile. Server-side records allow recovery.

### **2. Design for Stateless Recovery**

Every step should be recoverable with a **single identifier** (e.g., `appointmentId`, `sessionId`).

| Scenario                  | Recovery Mechanism                                                            |
| ------------------------- | ----------------------------------------------------------------------------- |
| Tab closed during payment | `/booking/recover?appointmentId=X` checks status, resumes or shows result     |
| Payment gateway timeout   | Webhook still fires → updates DB → user polls status or receives notification |
| Guest user (no account)   | Use `customerEmail` to look up pending bookings                               |
| Logged-in user            | Show pending bookings on dashboard with "Complete Payment" action             |

### **3. Guest vs Authenticated User Flows**

For flows that work both for guests and logged-in users:

| Flow State              | Guest User                                                     | Authenticated User             |
| ----------------------- | -------------------------------------------------------------- | ------------------------------ |
| **Identify user**       | `customerEmail` (entered in form)                              | `userId` from session          |
| **Recovery page**       | Email-based lookup: "Enter your email to check booking status" | Auto-show on dashboard         |
| **Notifications**       | None (or optional SMS if collected)                            | Telegram/WhatsApp notification |
| **Payment link expiry** | Include in URL, 30min default                                  | Same                           |

### **4. Payment Flow Error Scenarios**

| Error                 | Detection                            | User Experience                | Recovery                               |
| --------------------- | ------------------------------------ | ------------------------------ | -------------------------------------- |
| **Payment declined**  | Webhook `payment.failed`             | Show error, offer retry        | Keep pending deposit, allow re-attempt |
| **Payment timeout**   | No webhook within 30min              | Email reminder (if collected)  | Pending record expires, must restart   |
| **Webhook failure**   | Our server error                     | Silent to user                 | Retry queue, manual reconciliation     |
| **Duplicate payment** | Check `stripePaymentIntentId` unique | Prevent double charge          | Refund duplicate automatically         |
| **Partial payment**   | Amount mismatch                      | Reject, request correct amount | Clear instructions in payment UI       |

### **5. Pending Record Cleanup**

Expired pending records should be cleaned up:

```typescript
// Cron job or Inngest function
async function cleanupExpiredPendingDeposits() {
  // Delete PENDING deposits older than 24 hours
  // Delete PENDING appointments with no deposit after 1 hour
}
```

### **6. UX Patterns for Interrupted Flows**

- **Dashboard Banner**: "You have an incomplete booking. [Complete Payment] or [Cancel]"
- **Email Recovery**: If email collected, send "Complete your booking" link
- **Telegram/WhatsApp**: If user has account, send reminder via their preferred channel
- **Expiry Warning**: Show "This payment link expires in X minutes" in payment UI

### **7. Checklist for New Multi-Step Flows**

When designing any new flow, answer these questions:

- [ ] What DB records are created at each step?
- [ ] What happens if the user closes the browser at each step?
- [ ] How does a guest user recover without logging in?
- [ ] How does a logged-in user see pending items?
- [ ] What is the expiry time for incomplete flows?
- [ ] What cleanup is needed for abandoned flows?
- [ ] What webhooks/notifications confirm completion?
- [ ] How are duplicates prevented?

---

## ⚛️ 6. Next.js 14 Server vs Client Components - Best Practices

### **Overview**

Next.js 14 App Router uses **Server Components by default**, providing better performance, smaller JavaScript bundles, and improved SEO. Client Components should only be used when absolutely necessary for interactivity.

### **Default Approach: Server Components First**

**Rule of Thumb**: Every component is a Server Component unless it needs client-side features.

#### **Server Component Benefits**

- Zero JavaScript sent to browser for static content
- Direct database access (no API routes needed)
- Better SEO (fully rendered HTML)
- Automatic code splitting
- Access to backend resources (filesystem, databases)
- `generateMetadata()` support

#### **When Server Components Are Sufficient**

Server components can handle:

- Static content rendering
- Data fetching from databases
- Image optimization (`next/image`)
- Server-side logic
- Metadata generation
- Layout components (when they don't need interactivity)

---

### **When Client Components Are Required**

Use `'use client'` directive ONLY when you need:

#### **1. React Hooks**

- `useState`, `useEffect`, `useContext`
- `useReducer`, `useCallback`, `useMemo`
- Custom hooks that depend on above

#### **2. Browser APIs**

- `window`, `document`, `localStorage`
- Event listeners
- Geolocation, clipboard, etc.

#### **3. Event Handlers**

- `onClick`, `onChange`, `onSubmit`
- Mouse, keyboard, touch events
- Form interactions

#### **4. React Context Providers/Consumers**

- `useAuth()`, `useBooking()`, etc.
- Any context that requires client-side state

#### **5. Third-Party Libraries Requiring Browser**

- Chart libraries
- Animation libraries
- Client-only UI components

---

### **Patterns from Signature Trims Codebase**

#### **Pattern 1: Server Component Page with Client Children**

**GOOD Example**: Server component page with embedded client components

```tsx
// app/page.tsx - NO 'use client' directive
import { getAdminSettings } from '@/lib/database';
import LandingPage from '@/components/views/LandingPage'; // Client component

export default async function HomePage() {
  // Direct database access in server component
  const adminSettings = await getAdminSettings();

  return (
    <div>
      {/* Static server-rendered content */}
      <section>
        <h1>Signature Trims</h1>
        <p>Experience hair artistry...</p>
      </section>
      {/* Client component embedded in server component */}
      <LandingPage /> {/* This has 'use client' */}
    </div>
  );
}
```

**Why This Works**:

- Server component fetches data (no API route needed)
- Static HTML rendered on server
- Only `LandingPage` and its children ship JavaScript
- Best of both worlds: performance + interactivity where needed

---

#### **Pattern 2: Static Service Pages (Server Components)**

**GOOD Example**: Service detail pages

```tsx
// app/services/hair-colouring/page.tsx - NO 'use client'
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import ServiceBookingWrapper from '@/components/services/ServiceBookingWrapper';

export default async function HairColouringPage() {
  // Direct Drizzle query - server-side only
  const db = await getDb();
  const service = await db.query.services.findFirst({
    where: eq(schema.services.name, 'Hair Colouring'),
    with: { addons: true, category: true },
  });

  if (!service) notFound();

  return (
    <div>
      {/* Server-rendered content - no JS */}
      <div className="hero">
        <h1>{service.name}</h1>
        <p>{service.description}</p>
      </div>

      {/* Client component for booking form */}
      <ServiceBookingWrapper preSelectedServiceId={service.id} />
    </div>
  );
}

// Server-only metadata generation
export async function generateMetadata() {
  return {
    title: 'Hair Colouring | Signature Trims',
    description: '...',
  };
}
```

**Benefits**:

- SEO-friendly (fully rendered)
- No API route needed for service data
- Only booking form is interactive (client component)
- Faster page loads

---

#### **Pattern 3: Wrapper Components for Client Logic**

**GOOD Example**: Small client wrapper for interactive features

```tsx
// ServiceBookingWrapper.tsx - Client component
'use client';

import BookingForm from '../booking/BookingForm';

export default function ServiceBookingWrapper({
  preSelectedServiceId,
  serviceName,
}: ServiceBookingWrapperProps) {
  return (
    <div className="bg-gradient-to-b from-stone-50 to-white">
      <h2>Book Your {serviceName}</h2>
      <BookingForm preSelectedServiceId={preSelectedServiceId} />
    </div>
  );
}
```

**Usage in Server Component**:

```tsx
// Server component page
export default async function ServicePage({ params }) {
  const db = await getDb();
  const service = await db.query.services.findFirst({
    where: eq(schema.services.id, params.id),
  });

  return (
    <div>
      {/* Server-rendered static content */}
      <h1>{service.name}</h1>
      <p>{service.description}</p>

      {/* Client component boundary */}
      <ServiceBookingWrapper preSelectedServiceId={service.id} serviceName={service.name} />
    </div>
  );
}
```

---

### **Anti-Patterns to Avoid**

#### **❌ BAD: Entire Page as Client Component When Not Needed**

```tsx
// BAD - Unnecessary client component
'use client';

export default function AboutPage() {
  return (
    <div>
      <h1>About Us</h1>
      <p>Static content that doesn't need JavaScript...</p>
    </div>
  );
}
```

**Fix**: Remove `'use client'` - this should be a Server Component.

---

#### **❌ BAD: Fetching Data in Client Component When Server Could Do It**

```tsx
// BAD - Client-side data fetching for static data
'use client';

export default function ProductPage({ params }) {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(res => res.json())
      .then(setProduct);
  }, [params.id]);

  return <div>{product?.name}</div>;
}
```

**Fix**: Use Server Component with direct database access:

```tsx
// GOOD - Server component with direct DB access
export default async function ProductPage({ params }) {
  const db = await getDb();
  const product = await db.query.products.findFirst({
    where: eq(schema.products.id, params.id),
  });

  return <div>{product.name}</div>;
}
```

---

### **Minimizing Client Component Scope**

#### **Strategy: Push Client Boundary Down**

**BEFORE** (entire page is client):

```tsx
// page.tsx - ENTIRE page ships JavaScript
'use client';

export default function BlogPost({ params }) {
  const [likes, setLikes] = useState(0);

  return (
    <article>
      <h1>Blog Post Title</h1>
      <p>Long static content...</p>
      <button onClick={() => setLikes(likes + 1)}>Like ({likes})</button>
    </article>
  );
}
```

**AFTER** (only interactive part is client):

```tsx
// page.tsx - Server component
export default async function BlogPost({ params }) {
  const post = await getPost(params.id);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      {/* Only this component ships JS */}
      <LikeButton postId={post.id} />
    </article>
  );
}

// components/LikeButton.tsx - Small client component
('use client');

export function LikeButton({ postId }) {
  const [likes, setLikes] = useState(0);

  return <button onClick={() => setLikes(likes + 1)}>Like ({likes})</button>;
}
```

**Benefits**:

- 90% of page is static HTML (no JS)
- Only `LikeButton` ships JavaScript
- Better performance, SEO, and Time to Interactive

---

### **Layout Pattern: Server Layout + Client Providers**

**GOOD Example**: Root layout structure

```tsx
// app/layout.tsx - Server component (NO 'use client')
import { AuthProvider } from '@/context/AuthContext'; // Client component
import { BookingProvider } from '@/context/BookingContext'; // Client component

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Client providers wrap children */}
        <AuthProvider>
          <BookingProvider>
            <AppHeader />
            {children} {/* Server or client pages */}
            <AppFooter />
          </BookingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Why This Works**:

- Layout itself is server component
- Providers are client components (they use context)
- Child pages can be either server or client
- Shared state available via context throughout app

---

### **Performance & SEO Implications**

#### **Server Components**

- ✅ Zero JavaScript for static content
- ✅ Faster Time to Interactive (TTI)
- ✅ Better SEO (fully rendered HTML)
- ✅ Smaller bundle size
- ✅ No hydration cost
- ❌ No interactivity
- ❌ Can't use browser APIs

#### **Client Components**

- ✅ Full interactivity
- ✅ Browser API access
- ✅ Real-time updates
- ❌ JavaScript shipped to browser
- ❌ Hydration overhead
- ❌ Larger bundle size
- ❌ Slower TTI for large components

#### **Impact Example**

**All Client Components**: 500KB JavaScript bundle

```tsx
'use client'; // Everything in page.tsx
export default function Page() { ... }
```

**Optimized with Server Components**: 50KB JavaScript bundle

```tsx
// Server component (no 'use client')
export default async function Page() {
  // Only interactive parts are client components
  return (
    <>
      {staticContent} <InteractiveButton />
    </>
  );
}
```

**Result**: 90% reduction in JavaScript, faster page loads, better Core Web Vitals.

---

### **Developer Checklist**

When creating a new page or component, ask:

#### **✅ Can This Be a Server Component?**

- [ ] Does it only render static content?
- [ ] Does it fetch data on initial load only?
- [ ] Does it NOT use React hooks?
- [ ] Does it NOT need event handlers?
- [ ] Does it NOT access browser APIs?

**If YES to all** → Use Server Component (default, no directive)

#### **✅ Must This Be a Client Component?**

- [ ] Uses `useState`, `useEffect`, or other hooks?
- [ ] Requires event handlers (`onClick`, `onChange`)?
- [ ] Accesses browser APIs (`window`, `localStorage`)?
- [ ] Uses React Context (`useAuth`, `useBooking`)?
- [ ] Third-party library requires browser?

**If YES to any** → Add `'use client'` directive

#### **✅ Can I Split This Component?**

- [ ] Is only part of the component interactive?
- [ ] Can static content be separated?
- [ ] Can I extract interactive parts to smaller client components?

**If YES** → Refactor: Server component wrapper + small client children

---

### **Quick Reference Table**

| Feature            | Server Component | Client Component             |
| ------------------ | ---------------- | ---------------------------- |
| Default behavior   | ✅ Yes           | ❌ No (needs `'use client'`) |
| React hooks        | ❌ No            | ✅ Yes                       |
| Event handlers     | ❌ No            | ✅ Yes                       |
| Browser APIs       | ❌ No            | ✅ Yes                       |
| Direct DB access   | ✅ Yes           | ❌ No                        |
| `async` components | ✅ Yes           | ❌ No                        |
| SEO-friendly       | ✅ Yes           | ⚠️ Depends                   |
| JavaScript bundle  | ✅ 0KB           | ❌ Added to bundle           |
| Context consumers  | ❌ No            | ✅ Yes                       |
| `generateMetadata` | ✅ Yes           | ❌ No                        |

---

### **Common Mistakes & Solutions**

#### **Mistake 1: Marking Everything as Client Component**

- **Problem**: `'use client'` at the top of every file "just in case"
- **Solution**: Start without directive, add only when needed

#### **Mistake 2: Using API Routes When Direct DB Access Works**

- **Problem**: Server component fetches from `/api/data` instead of database
- **Solution**: Server components can query database directly

#### **Mistake 3: Not Splitting Components**

- **Problem**: Entire complex page marked as `'use client'`
- **Solution**: Extract interactive parts to separate client components

#### **Mistake 4: Hydration Mismatches**

- **Problem**: Server-rendered content differs from client
- **Solution**: Avoid `new Date()`, `Math.random()`, etc. in server components

---

### **Summary: The Golden Rules**

1. **Server by Default**: No `'use client'` unless absolutely required
2. **Client When Needed**: Add `'use client'` for hooks, events, browser APIs
3. **Small Client Components**: Extract minimal interactive parts
4. **Server for Data**: Use server components for database queries
5. **Client for Interactivity**: Use client components for forms, search, real-time
6. **Composition Wins**: Server wrapper + client children = optimal performance

---

## 🔗 Related Files

- **Implementation Plan**: `../implementation-plans/ai-agents-plan.md`
- **Design System**: `../design/DESIGN_SYSTEM.md` - UI components
- **Telegram Testing**: `../telegram/TELEGRAM_TESTING_GUIDE.md`
- **Coding Guidelines**: `../../CLAUDE.md`
- **Services Directory**: `../../src/services/`
- **API Routes**: `../../src/app/api/chat/`, `../../src/app/api/telegram/`

---

## 📅 Stylist Google Calendar Sync

Stylists can connect their personal Google Calendar to automatically sync appointments assigned to them.

### Key Files

- **OAuth Routes**: `src/app/api/auth/google/connect|callback|disconnect/route.ts`
- **Calendar Logic**: `src/lib/google.ts` (per-stylist OAuth + fallback to salon calendar)
- **Database**: `src/db/schema.ts` - `stylists` table includes Google OAuth token fields
- **Dashboard**: `src/components/views/StylistDashboard.tsx` - Includes Profile Management (Name Edit) & Calendar Sync
- **API**: `src/app/api/stylists/me/route.ts` - Returns `googleTokenStatus` for dashboard warnings

### Self-Healing Token System

The dashboard shows token status with clear, non-technical UI:

- **Green "Connected"**: Token is valid and syncing works
- **Amber "Connection Expired"**: Token expired, user sees friendly "Reconnect" button
- **Gray "Not Connected"**: Calendar not connected yet

Token status values: `valid` | `expiring_soon` | `expired` | `not_connected`

> **Note**: If OAuth app is in "Testing" mode, refresh tokens expire after 7 days. Publish the OAuth consent screen to get permanent tokens.

### Required Environment Variables

```
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
```

---

## 👥 Admin Customer Management

Admin-only page to view and manage customers with aggregated statistics.

### Key Files

- **Page**: `src/app/[locale]/admin/customers/page.tsx` - Responsive table (desktop) + cards (mobile)
- **API**: `src/app/api/admin/customers/route.ts` - Fetches customers with stats (visits, status, next appointment, preferred stylist)
- **Components**: `src/components/admin/customers/CustomerCard.tsx` - Mobile card component
- **Types**: `src/types.ts` - `CustomerWithStats`, `CustomerStatus`
- **Navigation**: Added to `AdminNavigation.tsx` under **Customers** section

### Features

- **Status Badges**: NEW, ACTIVE, AT_RISK, CHURNED (calculated from visit patterns)
- **Contact Method Badge**: Telegram/WhatsApp/Email based on `authProvider`
- **Next Appointment**: Highlighted display with date, time, and stylist
- **Preferred Stylist**: Most frequently booked stylist
- **Filters**: Status tabs, search by name/email/phone
- **Pagination**: 25/50/100 items per page

---

## 🎛️ Admin Layout Architecture

Admin pages use a shared layout pattern for consistent auth handling and persistent navigation.

### Key Files

- **Shared Layout**: `src/app/[locale]/admin/layout.tsx` - Handles auth check once, renders `AdminLayout` component
- **Layout Component**: `src/components/admin/AdminLayout.tsx` - Sidebar navigation, responsive design
- **Navigation**: `src/components/admin/AdminNavigation.tsx` - Client-side routing between admin pages

### Architecture

```
layout.tsx (auth check + AdminLayout wrapper)
  └── page.tsx (individual page content only)
```

Each admin page (`/admin/**/page.tsx`) renders only its content - auth and layout are handled by the shared `layout.tsx`. This prevents:

- Duplicate auth checks on navigation
- Page refresh effect when switching admin pages
- Re-rendering the sidebar on every navigation

### Admin Pages (10 total)

| Route                      | File                         |
| -------------------------- | ---------------------------- |
| `/admin`                   | `page.tsx` - Dashboard home  |
| `/admin/appointments`      | `appointments/page.tsx`      |
| `/admin/availability`      | `availability/page.tsx`      |
| `/admin/stylists`          | `stylists/page.tsx`          |
| `/admin/customers`         | `customers/page.tsx`         |
| `/admin/chat`              | `chat/page.tsx`              |
| `/admin/settings/business` | `settings/business/page.tsx` |
| `/admin/settings/hours`    | `settings/hours/page.tsx`    |
| `/admin/settings/closures` | `settings/closures/page.tsx` |
| `/admin/settings/services` | `settings/services/page.tsx` |

---

**Production-ready AI agent system with natural language booking, automated retention, and multi-channel messaging.**

---

## 📅 Production Incident Log

### **2026-01-03: 500 Error on Production (Missing Columns)**

- **Issue**: `signaturetrims.com` crashed with 500 Internal Server Error.
- **Cause**: Production database was missing `processingWaitTime` and `processingDuration` columns in the `services` table, causing server-side rendering to fail due to schema mismatch. Migration `0005` was partially applied or conflicted.
- **Resolution**: Created manual script `scripts/fix-db-schema.js` to `ALTER TABLE services` and add the missing columns. Verified site recovery.
- **Action Item**: Ensure production database migrations are strictly synchronized with deployments.

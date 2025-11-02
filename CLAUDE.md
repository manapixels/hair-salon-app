# CLAUDE.md

**Luxe Cuts** - Next.js 14 hair salon booking app with OAuth authentication, AI chat, and comprehensive management features.

## 🚀 Quick Start

```bash
npm install --legacy-peer-deps
npm run dev
npm run typecheck && npm run lint
```

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **Auth**: OAuth-only (WhatsApp/Telegram) with secure HTTP-only cookies
- **AI**: Google Gemini for chat functionality
- **Integrations**: Google Calendar, WhatsApp/Telegram messaging

## 📁 Project Structure

```
src/
├── app/
│   ├── api/          # API routes (appointments, auth, admin)
│   ├── admin/        # Admin dashboard page (/admin)
│   ├── dashboard/    # Customer dashboard page (/dashboard)
│   └── page.tsx      # Home page (booking)
├── components/       # React components (booking, dashboard, admin)
├── context/         # Auth & booking contexts
├── lib/             # Core utilities (database, session, calendar)
├── services/        # External integrations (AI, messaging)
└── types.ts         # TypeScript definitions
```

## 🌐 Routes

- **`/`** - Home page with booking form
- **`/dashboard`** - Customer dashboard (requires auth)
- **`/admin`** - Admin dashboard (requires ADMIN role)

## 🔐 Authentication & Security

- **OAuth-Only**: WhatsApp/Telegram login (no passwords)
- **Secure Sessions**: HTTP-only JWT cookies with 7-day expiration
- **Role-Based Access**: Admin/customer with middleware protection
- **Session Middleware**: `withAuth()`, `withAdminAuth()`, `withOptionalAuth()`

## ✅ Current Features

### **Customer Experience**

- Multi-service booking with stylist selection
- Personal dashboard (appointments, profile, cancellation, rescheduling)
- Real-time availability checking
- WhatsApp/Telegram notifications
- AI chat for booking assistance

### **Admin Management**

- **Tab-based navigation**: Appointments, Stylists, Availability & Settings
- **Appointments Tab**: Advanced filtering, search, bulk operations, pagination
- **Stylists Tab**: Inline stylist management (profiles, specializations, schedules)
- **Availability Tab**: Time blocking, business hours, appointment overview
- Automated reminder system with GitHub Actions

### **Integrations**

- **Google Calendar**: Auto-sync appointments
- **WhatsApp/Telegram**: Confirmations, reminders, AI chat
  - **Note**: Email confirmations are NOT handled. All appointment notifications (confirmations, reminders, updates) are sent exclusively via WhatsApp or Telegram based on user's auth provider
- **Automated Reminders**: 24-hour notifications via GitHub Actions

## 🎯 Development Priorities

### **High Priority**

1. **Rate Limiting** - API protection (100 req/min per IP)
2. **Input Validation** - Zod schema implementation
3. **Security Headers** - CSP, HSTS implementation

### **Medium Priority**

4. **Performance Optimization** - Image optimization, caching

### **Technical Infrastructure**

7. **Testing Suite** - Jest + React Testing Library + Playwright
8. **Request Sanitization** - Enhanced input cleaning

## 🔧 Environment Variables

```bash
# Database
DATABASE_URL=your_neon_postgresql_url

# AI & Messaging
GEMINI_API_KEY=your_gemini_key
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
TELEGRAM_BOT_TOKEN=your_telegram_token

# Security
JWT_SECRET=your-secure-jwt-secret

# Google Calendar (optional)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
```

## 📱 Key Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm run typecheck       # TypeScript validation
npm run lint           # ESLint check
npm run format         # Prettier formatting

# Database
npx prisma db push     # Push schema changes
npx prisma studio      # Database GUI

# Admin
node scripts/create-admin.js promote <email>  # Promote user to admin
```

## 🎯 Implementation Guidelines

1. **Follow existing patterns** in components and API routes
2. **Use TypeScript types** from `src/types.ts`
3. **Database operations** go in `src/lib/database.ts`
4. **API routes** use App Router format with middleware
5. **Security first** - always use session middleware for protected routes
6. **Loading states** - use standardized components (see Loading States section below)

---

## 🔄 Loading States & UX Patterns

### **Standardized Loading Components**

All loading indicators use reusable components from `/src/components/loaders/`:

```tsx
import { LoadingSpinner } from '@/components/loaders/LoadingSpinner';
import { LoadingButton } from '@/components/loaders/LoadingButton';
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader';
import { StylistCardSkeleton } from '@/components/loaders/StylistCardSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
```

### **When to Use Each Loader**

| Loader Type          | Use Case                  | Example                    |
| -------------------- | ------------------------- | -------------------------- |
| **LoadingSpinner**   | Single items, small areas | API calls, inline loading  |
| **SkeletonLoader**   | Known layout, lists       | Card grids, repeated items |
| **LoadingButton**    | Button actions            | Form submissions, actions  |
| **Domain Skeletons** | Complex layouts           | StylistCardSkeleton        |

### **Quick Start Examples**

**1. Basic Spinner with Message**

```tsx
{
  loading && <LoadingSpinner size="md" message="Loading data..." />;
}
```

**2. Delayed Loading (Prevents Flash)**

```tsx
const showLoader = useDelayedLoading(loading, { delay: 150, minDuration: 300 });

{
  showLoader && <LoadingSpinner message="Finding stylists..." />;
}
```

**3. Skeleton Loader for Lists**

```tsx
{
  loading ? (
    <div className="grid grid-cols-3 gap-4">
      <StylistCardSkeleton count={3} />
    </div>
  ) : (
    <div className="grid grid-cols-3 gap-4">
      {items.map(item => (
        <Card key={item.id} {...item} />
      ))}
    </div>
  );
}
```

**4. Loading Button**

```tsx
<LoadingButton
  loading={submitting}
  loadingText="Saving..."
  onClick={handleSubmit}
  className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
>
  Save Changes
</LoadingButton>
```

**5. Error State with Retry**

```tsx
{
  error && <ErrorState title="Failed to Load" message={error} onRetry={refetch} />;
}
```

**6. Empty State**

```tsx
{
  !loading && items.length === 0 && (
    <EmptyState title="No Results" description="Try adjusting your filters" />
  );
}
```

### **Timing Guidelines**

- **< 100ms**: No loader (feels instant)
- **100-300ms**: Use `useDelayedLoading` with 150ms delay
- **> 300ms**: Show loader immediately
- **Minimum display**: 300ms (prevents jarring flash)

### **Accessibility Requirements**

All loading states MUST include:

```tsx
// ARIA live region for screen readers
<div className="sr-only" aria-live="polite" aria-atomic="true">
  {loading && 'Loading data'}
  {!loading && `${items.length} items loaded`}
</div>

// Proper ARIA attributes on loaders
<div role="status" aria-label="Loading">
  <LoadingSpinner />
</div>
```

### **Best Practices**

1. ✅ **Always use delayed loading** for API calls to prevent flash
2. ✅ **Match skeleton to actual content** (same layout, proper count)
3. ✅ **Provide contextual messages** ("Finding stylists who can perform Haircut...")
4. ✅ **Include retry buttons** in error states
5. ✅ **Add ARIA live regions** for screen readers
6. ✅ **Disable form inputs** during submission, don't hide them
7. ❌ **Don't use color alone** for loading indicators
8. ❌ **Don't block entire UI** unless absolutely necessary
9. When coming up with implementation plans, be extremely concise. Sacrifice grammar for the sake of conciseness.

---

## 📅 Date & Time Display Guidelines

### **User-Friendly DateTime Formatting**

All user-facing date/time displays MUST use human-readable formats from `/src/lib/timeUtils.ts`:

```tsx
import { formatDisplayDate, formatLongDate, formatTime12Hour } from '@/lib/timeUtils';
```

### **Available Utilities**

| Function              | Input          | Output                | Use Case                |
| --------------------- | -------------- | --------------------- | ----------------------- |
| `formatDisplayDate()` | Date or string | "18 Oct 2025"         | Compact date displays   |
| `formatLongDate()`    | Date or string | "Monday, 18 Oct 2025" | Confirmations, messages |
| `formatTime12Hour()`  | "HH:MM" (24h)  | "2pm" or "2:30pm"     | All user-facing times   |

### **When to Use Each Format**

**Dates:**

- **Compact UI** (cards, lists, tables): `formatDisplayDate()` → "18 Oct 2025"
- **Messages & confirmations**: `formatLongDate()` → "Monday, 18 Oct 2025"
- **Form inputs**: Keep YYYY-MM-DD (HTML requirement)
- **Database/API**: ISO strings (technical, not user-facing)

**Times:**

- **All user-facing displays**: `formatTime12Hour()` → "2pm", "2:30pm"
- **Form inputs**: Keep HH:MM (HTML requirement)
- **Database/API**: Keep HH:MM or ISO (technical, not user-facing)

### **Quick Reference Examples**

#### ✅ GOOD - User-Friendly

```tsx
// UI Components
<p>Date: {formatDisplayDate(appointment.date)}</p>
<p>Time: {formatTime12Hour(appointment.time)}</p>
// Output: "Date: 18 Oct 2025" "Time: 2pm"

// Messages & Notifications
`Your appointment is confirmed for ${formatDisplayDate(appointment.date)} at ${formatTime12Hour(appointment.time)}`
// Output: "Your appointment is confirmed for 18 Oct 2025 at 2pm"

// Combined format (like Gemini confirmation)
const formattedDate = formatDisplayDate(new Date(dateString));
const formattedTime = formatTime12Hour(timeString);
`Confirmed for ${formattedDate}, ${formattedTime}`
// Output: "Confirmed for 18 Oct 2025, 2pm"
```

#### ❌ BAD - Technical Format

```tsx
// DON'T show raw database/API formats to users
<p>Date: {appointment.date}</p>              // "2025-10-18T00:00:00.000Z"
<p>Time: {appointment.time}</p>              // "14:00"
`Appointment on ${args?.date} at ${args?.time}` // "2025-10-18 at 14:00"
```

### **Context-Specific Patterns**

**UI Components** (CustomerDashboard, AdminDashboard, Modals):

```tsx
<span>{formatDisplayDate(appointment.date)}</span>
<span>at {formatTime12Hour(appointment.time)}</span>
```

**Messaging Services** (WhatsApp, Telegram, Email):

```tsx
`🕐 Time: ${formatTime12Hour(appointment.time)}``📅 ${formatDisplayDate(appointment.date)} at ${formatTime12Hour(appointment.time)}`;
```

**AI Chat Responses** (Gemini, Bot Commands):

```tsx
const date = formatDisplayDate(new Date(appointment.date));
const time = formatTime12Hour(appointment.time);
text: `Your appointment is confirmed for ${date}, ${time}`;
```

### **Technical vs User-Facing**

**Technical contexts (keep as-is):**

- HTML form inputs (`<input type="date">`, `<input type="time">`)
- API request/response bodies (JSON)
- Database queries and storage
- Function parameters in Gemini API declarations
- Google Calendar API integration

**User-facing contexts (MUST format):**

- React component text/JSX output
- WhatsApp/Telegram messages
- Email notifications
- Confirmation messages
- Error messages with dates/times
- Dashboard displays
- Modal/dialog content

### **Migration Notes**

18 locations currently need updating across:

- `src/services/reminderService.ts` (1 location)
- `src/services/messagingService.ts` (4 locations)
- `src/services/botCommandService.ts` (5 locations)
- `src/services/geminiService.ts` (3 locations)
- `src/components/CustomerDashboard.tsx` (1 location)
- `src/components/RescheduleModal.tsx` (1 location)
- `src/components/AdminDashboard.tsx` (2 locations - optional)

### **Best Practices**

1. ✅ **Import once** at the top of each file using datetime formatting
2. ✅ **Format at display time**, not at data retrieval
3. ✅ **Keep technical formats** for forms, APIs, database operations
4. ✅ **Always use formatTime12Hour()** for user-facing times (never raw HH:MM)
5. ❌ **Never** show ISO strings or YYYY-MM-DD to end users
6. ❌ **Never** show 24-hour time format (14:00) to end users

---

**Production-ready salon management system with OAuth authentication, comprehensive customer self-service, automated notifications, and secure session management.**

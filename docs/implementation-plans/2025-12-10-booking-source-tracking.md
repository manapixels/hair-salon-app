# Booking Source Tracking

Track whether appointments are booked via Web App, Telegram, or WhatsApp. Display as badge in admin appointments list.

---

## Proposed Changes

### Database Layer

#### [MODIFY] [schema.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/db/schema.ts)

Add `BookingSource` enum and `bookingSource` column to appointments table:

```diff
+export const bookingSourceEnum = pgEnum('BookingSource', ['WEB', 'TELEGRAM', 'WHATSAPP']);

 export const appointments = pgTable('appointments', {
   // ... existing fields ...
+  bookingSource: bookingSourceEnum('bookingSource').default('WEB').notNull(),
 });
```

---

### Types

#### [MODIFY] [types.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/types.ts)

Add `bookingSource` to `Appointment` interface:

```diff
+export type BookingSource = 'WEB' | 'TELEGRAM' | 'WHATSAPP';

 export interface Appointment {
   // ... existing fields ...
+  bookingSource: BookingSource;
 }
```

---

### Database Functions

#### [MODIFY] [database.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/lib/database.ts)

Update `bookNewAppointment` to accept `bookingSource` parameter.

---

### API Endpoints

#### [MODIFY] [route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/appointments/route.ts)

Pass `bookingSource: 'WEB'` when creating appointments from web.

#### [MODIFY] [route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/telegram/webhook/route.ts)

Pass `bookingSource: 'TELEGRAM'` for Telegram bookings.

#### [MODIFY] [route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/whatsapp/route.ts)

Pass `bookingSource: 'WHATSAPP'` for WhatsApp bookings.

---

### Admin UI

#### [MODIFY] [page.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/%5Blocale%5D/admin/appointments/page.tsx)

Add booking source badge next to customer info:

```tsx
<span className="text-xs px-2 py-0.5 rounded-full bg-muted">
  {appointment.bookingSource === 'TELEGRAM' && '📲 Telegram'}
  {appointment.bookingSource === 'WHATSAPP' && '💬 WhatsApp'}
  {appointment.bookingSource === 'WEB' && '🌐 Web'}
</span>
```

---

### Localization

#### [MODIFY] [en.json](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/i18n/en.json) & [zh.json](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/i18n/zh.json)

Add translation keys for booking source labels.

---

## Verification Plan

### Migration

```bash
npm run db:generate   # Generate migration
npm run db:push       # Apply to database
```

### Manual Verification

1. Check existing appointments show "🌐 Web" badge
2. Book via web → verify "WEB" source saved
3. Verify admin page displays correct badges

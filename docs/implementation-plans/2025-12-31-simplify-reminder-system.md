# Simplify Reminder System

Remove rebooking nudge, win-back, and feedback request. Limit appointment reminders to men's haircut only.

## Proposed Changes

### Delete Files (Inngest Functions)

- [DELETE] [feedback.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/inngest/feedback.ts)
- [DELETE] [rebooking.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/inngest/rebooking.ts)
- [DELETE] [winback.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/inngest/winback.ts)

---

### Remove Unused Components

#### [MODIFY] [route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/inngest/route.ts)

Remove imports and function registrations for feedback, rebooking, winback

#### [MODIFY] [retention.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/config/retention.ts)

Remove feedback, rebooking, winback config (keep only rate limit if still needed)

---

### Filter Reminders for Men's Haircut

#### [MODIFY] [database.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/lib/database.ts)

Add filter in `getUpcomingAppointmentsForReminders` to only return appointments that include men's haircut category (check services array for category name containing "haircut" or specific category ID)

---

### Update Documentation

#### [MODIFY] [AGENTS.md](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/AGENTS.md)

Update retention engine section to reflect simplified system

---

## Verification Plan

### TypeScript Check

```bash
npx tsc --noEmit
```

### Manual Test

Ask user to manually verify:

1. The Inngest dashboard no longer shows feedback/rebooking/winback functions
2. An appointment reminder is only sent for men's haircut appointments

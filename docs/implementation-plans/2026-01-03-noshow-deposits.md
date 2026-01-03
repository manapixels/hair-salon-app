# No-Show Protection: First-Timer Deposits

Deposit system for first-time customers. Admin-configurable. Manual balance collection post-service.

---

## Admin Configuration

**Location**: Admin → Settings → Deposits

| Setting             | Default | Description                  |
| ------------------- | ------- | ---------------------------- |
| `depositEnabled`    | true    | Master toggle                |
| `depositPercentage` | 15%     | Of estimated service price   |
| `trustThreshold`    | 1       | Completed visits to bypass   |
| `refundWindowHours` | 24      | Hours before for full refund |

---

## UI Changes

### Deposit Badges (Admin Appointments)

Show deposit status on appointment cards/rows:

| Status              | Badge                 | Color  |
| ------------------- | --------------------- | ------ |
| Deposit paid        | `💳 Deposit: $12`     | Green  |
| Deposit pending     | `⏳ Awaiting deposit` | Yellow |
| No deposit required | (none)                | -      |

**Locations**:

- Admin → Appointments list
- Stylist dashboard appointment cards
- Calendar day view popover

---

## User Flows

### Web First-Timer

1. Guest books → sees "Deposit: $X (15%)"
2. Redirects to HitPay → pays → webhook confirms
3. **Recovery**: `/booking/status` (email lookup)

### Telegram First-Timer

1. `/book` → on confirm, sends payment link button
2. User pays → webhook → confirmation message

### Trusted Customer

- `totalVisits >= trustThreshold` → no deposit step

---

## Database

```sql
ALTER TABLE "admin_settings" ADD COLUMN "depositEnabled" boolean DEFAULT true;
ALTER TABLE "admin_settings" ADD COLUMN "depositPercentage" integer DEFAULT 15;
ALTER TABLE "admin_settings" ADD COLUMN "depositTrustThreshold" integer DEFAULT 1;
ALTER TABLE "admin_settings" ADD COLUMN "depositRefundWindowHours" integer DEFAULT 24;

CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FORFEITED');

CREATE TABLE "deposits" (
  "id" text PRIMARY KEY,
  "appointmentId" text REFERENCES "appointments"("id") ON DELETE CASCADE,
  "customerEmail" text NOT NULL,
  "amount" integer NOT NULL,
  "status" "DepositStatus" DEFAULT 'PENDING',
  "hitpayPaymentId" text UNIQUE,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "paidAt" timestamp
);
```

---

## Files

### New

| File                                                      | Purpose                |
| --------------------------------------------------------- | ---------------------- |
| `src/services/paymentService.ts`                          | HitPay API             |
| `src/components/admin/settings/salon/DepositSettings.tsx` | Admin config           |
| `src/components/ui/DepositBadge.tsx`                      | Status badge component |
| `src/app/api/payments/webhook/route.ts`                   | HitPay webhook         |
| `src/app/[locale]/booking/status/page.tsx`                | Guest recovery         |

### Modified

| File                                     | Changes                           |
| ---------------------------------------- | --------------------------------- |
| `src/db/schema.ts`                       | Add deposits table + admin fields |
| `src/components/booking/BookingForm.tsx` | Add deposit step                  |
| `src/services/botCommandService.ts`      | Payment link on confirm           |
| `src/components/admin/appointments/*`    | Add deposit badges                |

---

## Env Variables

```bash
HITPAY_API_KEY=xxx
HITPAY_SALT=xxx
```

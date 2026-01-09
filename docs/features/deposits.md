# No-Show Protection (Deposits)

First-time customers (0 completed visits) must pay a deposit to secure their booking.

---

## Key Files

| File                                                      | Purpose                    |
| --------------------------------------------------------- | -------------------------- |
| `src/services/paymentService.ts`                          | HitPay API integration     |
| `src/inngest/depositFunctions.ts`                         | Auto-cancel, daily summary |
| `src/components/admin/settings/salon/DepositSettings.tsx` | Admin config               |

---

## Settings

Configurable in Admin Dashboard → Deposits:

| Setting                    | Default | Description                 |
| -------------------------- | ------- | --------------------------- |
| `depositEnabled`           | true    | Toggle deposit requirement  |
| `depositPercentage`        | 15%     | Percentage of service total |
| `depositTrustThreshold`    | 1       | Visits before trusted       |
| `depositRefundWindowHours` | 24      | Cancellation deadline       |

---

## Flow

```
1. First-timer books → Create PENDING deposit
2. Redirect to HitPay payment (Web) or show link (Telegram)
3. If paid → Appointment confirmed
4. If unpaid after 2hr → Auto-cancel + notify customer
```

---

## Environment Variables

```bash
HITPAY_API_KEY=your_api_key
HITPAY_SALT=your_webhook_salt
```

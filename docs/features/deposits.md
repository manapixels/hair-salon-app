# No-Show Protection (Deposits)

First-time customers (0 completed visits) must pay a deposit to secure their booking.

---

## Key Files

| File                                                              | Purpose                     |
| ----------------------------------------------------------------- | --------------------------- |
| `src/services/paymentService.ts`                                  | Stripe API integration      |
| `src/inngest/depositFunctions.ts`                                 | Auto-cancel, daily summary  |
| `src/components/admin/settings/salon/DepositSettings.tsx`         | Admin config                |
| `src/components/booking/step4-confirmation/DepositStep.tsx`       | Embedded payment form (web) |
| `src/components/booking/step4-confirmation/StripePaymentForm.tsx` | Stripe Elements wrapper     |

---

## Settings

Configurable in Admin Dashboard → Deposits:

| Setting                    | Default | Description                |
| -------------------------- | ------- | -------------------------- |
| `depositEnabled`           | true    | Toggle deposit requirement |
| `depositAmount`            | 500     | Fixed amount in cents ($5) |
| `depositTrustThreshold`    | 1       | Visits before trusted      |
| `depositRefundWindowHours` | 24      | Cancellation deadline      |

---

## Flow

### Web Booking

```
1. First-timer books → Create PENDING deposit + PaymentIntent
2. Embedded Stripe Payment Elements form (no redirect)
3. User enters card → stripe.confirmPayment()
4. Webhook confirms → Appointment SCHEDULED
5. If unpaid after 2hr → Auto-cancel + notify customer
```

### Telegram Booking

```
1. First-timer books → Create Stripe Checkout Session
2. Bot shows "Pay Deposit" button with checkout URL
3. User completes payment on Stripe page
4. Webhook confirms → Send Telegram confirmation
```

---

## Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Webhook Events

The `/api/payments/webhook` endpoint handles:

- `payment_intent.succeeded` - Web payments via Elements
- `checkout.session.completed` - Telegram payments via Checkout
- `payment_intent.payment_failed` - Failed payment logging

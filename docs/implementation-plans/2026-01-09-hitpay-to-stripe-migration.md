# Migrate Deposit Payments from HitPay to Stripe

Replace HitPay with Stripe **Payment Elements** (embedded form) for appointment deposits.

**User Decisions:**

- ✅ Use Stripe sandbox (test mode)
- ✅ Rename columns (`hitpay*` → `stripe*`)
- ✅ Use Payment Elements (embedded, no page redirect)

---

## Architecture: Payment Elements + PaymentIntent

```
┌─────────────────┐    1. Create PaymentIntent    ┌─────────────────┐
│   DepositStep   │ ───────────────────────────▶  │  /api/payments  │
│   (client)      │ ◀─────────────────────────────│    /create      │
│                 │    2. clientSecret             └─────────────────┘
│                 │
│  ┌───────────┐  │    3. User enters card
│  │ Elements  │  │
│  └───────────┘  │
│                 │    4. stripe.confirmPayment()
│                 │ ───────────────────────────▶  Stripe API
│                 │
└─────────────────┘
         │
         │ 5. payment_intent.succeeded webhook
         ▼
┌─────────────────┐
│ /api/payments   │ ──▶ Update deposit status to PAID
│   /webhook      │
└─────────────────┘
```

---

## Proposed Changes

### New Dependencies

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

---

### Payment Service

#### [MODIFY] [paymentService.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/services/paymentService.ts)

| Function                 | Change                                             |
| ------------------------ | -------------------------------------------------- |
| `createDepositPayment`   | Create Stripe PaymentIntent, return `clientSecret` |
| `verifyWebhookSignature` | Use `stripe.webhooks.constructEvent()`             |
| `handlePaymentWebhook`   | Handle `payment_intent.succeeded` event            |
| `refundDeposit`          | Use `stripe.refunds.create()`                      |

---

### API Routes

#### [MODIFY] [route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/payments/create/route.ts)

- Return `clientSecret` instead of `paymentUrl`

#### [MODIFY] [route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/payments/webhook/route.ts)

- Handle Stripe webhook format with signature verification

---

### Database

#### [MODIFY] [schema.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/db/schema.ts)

Rename: `hitpayPaymentId` → `stripePaymentIntentId`

#### [NEW] drizzle/0006_rename_hitpay_to_stripe.sql

```sql
ALTER TABLE "deposits" RENAME COLUMN "hitpayPaymentId" TO "stripePaymentIntentId";
ALTER TABLE "deposits" DROP COLUMN "hitpayPaymentUrl";
```

---

### Types

#### [MODIFY] [types.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/types.ts)

```diff
- hitpayPaymentId?: string | null;
- hitpayPaymentUrl?: string | null;
+ stripePaymentIntentId?: string | null;
```

---

### UI Components

#### [NEW] StripePaymentForm.tsx

Client component with Stripe Elements:

- `CardElement` or `PaymentElement`
- Submit button with loading state
- Error handling

#### [MODIFY] [DepositStep.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/components/booking/step4-confirmation/DepositStep.tsx)

- Fetch `clientSecret` from API
- Wrap form in `<Elements>` provider
- Embed `<StripePaymentForm>` instead of redirect

---

### Bot Service (Telegram)

#### [MODIFY] [botCommandService.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/services/botCommandService.ts)

- Telegram can't embed Elements → Use Stripe Checkout link instead
- Create Checkout Session for Telegram, PaymentIntent for Web

---

### Documentation

#### [MODIFY] [AGENTS.md](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/AGENTS.md)

---

## Environment Variables

**Remove:** `HITPAY_API_KEY`, `HITPAY_SALT`

**Add:**

- `STRIPE_SECRET_KEY` - `sk_test_...`
- `STRIPE_WEBHOOK_SECRET` - `whsec_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - `pk_test_...`

---

## Verification

1. **Web Flow:** Book → embedded card form → pay with `4242 4242 4242 4242` → success
2. **Webhook:** `stripe listen --forward-to localhost:3000/api/payments/webhook`
3. **Telegram:** Payment link → Stripe Checkout → confirmation message

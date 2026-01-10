# Auth, Payment, and Email Flow Changes

Implementation plan for: (1) hiding WhatsApp login, (2) adding magic link email auth, (3) fixing Stripe deposit for new users, (4) booking confirmation emails with reschedule/cancel links.

---

## User Review Required

> [!IMPORTANT] > **Magic Link Email Auth**: Users will receive a login link via email that logs them in without a password. Token expires after 15 minutes.

> [!WARNING] > **WhatsApp Login**: Will be hidden from UI. The WhatsApp OTP dev fallback will be removed - if WhatsApp service is unavailable, users will see an appropriate error message.

---

## Proposed Changes

### 1. Auth Components

#### [MODIFY] [OAuthLoginModal.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/components/auth/OAuthLoginModal.tsx)

- Hide WhatsApp login button and view
- Add Magic Link email login button and view
- Update type `LoginView` to include `'email'` instead of `'whatsapp'`

#### [NEW] [MagicLinkLogin.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/components/auth/MagicLinkLogin.tsx)

- Email input form for requesting magic link
- Success state showing "Check your email"
- Reuses existing styling patterns

---

### 2. Auth API Routes

#### [NEW] [route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/auth/magic-link/request/route.ts)

- Generate secure token (stored in DB with 15-min expiry)
- Send email with magic link via existing email service
- Auto-create user if email not registered

#### [NEW] [route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/auth/magic-link/verify/route.ts)

- Verify token, create session cookie
- Delete used token

---

### 3. WhatsApp OTP Route

#### [MODIFY] [route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/auth/whatsapp/request-otp/route.ts)

- Remove `testOtp` field from response (both dev and prod)
- Return error 503 when WhatsApp is unavailable (no dev fallback)

---

### 4. Booking Flow - Deposit Fix

#### [MODIFY] [BookingForm.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/components/booking/BookingForm.tsx)

**Root Cause**: The current code expects `paymentUrl` for redirect (Telegram flow) but the web API returns `clientSecret` for embedded Stripe Elements.

**Fix**: Replace the inline deposit check with the existing `DepositStep` component which properly handles `clientSecret` and renders embedded Stripe Elements.

```diff
- // Check if deposit is required
- const depositResponse = await fetch('/api/payments/create', {...});
- if (depositData.required && depositData.paymentUrl) {
-   window.location.href = depositData.paymentUrl;
-   return;
- }
+ // Show DepositStep component after booking created
+ // DepositStep handles clientSecret and embedded payment
```

---

### 5. User Service

#### [MODIFY] [userService.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/services/userService.ts)

- Add `createOrGetUserByEmail(email, name)` function
- Used by both magic link and booking form for new users

---

### 6. Database Schema

#### [MODIFY] [schema.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/db/schema.ts)

- Add `magic_link_tokens` table:
  - `id`, `token`, `email`, `expiresAt`, `createdAt`

---

### 7. i18n Updates

#### [MODIFY] Translation files

- Add magic link translations to `OAuthLoginModal` namespace

---

### 8. Email Service (NEW)

#### [NEW] [emailService.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/services/emailService.ts)

- Use Resend API for transactional emails
- `sendMagicLinkEmail(email, token)` - for passwordless login
- `sendBookingConfirmationEmail(appointment)` - for booking confirmations
- Requires `RESEND_API_KEY` environment variable

---

### 9. Booking Confirmation Email Template

#### [NEW] [BookingConfirmationEmail.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/emails/BookingConfirmationEmail.tsx)

Beautiful HTML email template using shadcn-inspired design with brand colors:

- **Gold header** (#7A6400) with salon branding
- **Appointment summary**: service, stylist, date, time, duration
- **Action buttons**: Reschedule | Cancel Appointment
- **Footer** with salon contact info

---

## Verification Plan

### Manual Testing

Since this involves email sending, Stripe payments, and auth flows, manual testing is required:

1. **Magic Link Login**:
   - Go to `/` and click "Login"
   - Select "Continue with Email"
   - Enter email, click "Send Magic Link"
   - Check inbox for email (or check server logs in dev)
   - Click link → should be logged in

2. **New User Booking with Deposit**:
   - Log out or use incognito
   - Go to booking form, complete steps 1-3
   - Enter a new email (never used before)
   - Click "Confirm Appointment"
   - Should see embedded Stripe payment form (not redirect)
   - Complete payment with test card `4242 4242 4242 4242`

3. **WhatsApp Hidden**:
   - Login modal should show only Email and Telegram options
   - WhatsApp button should not be visible

4. **Booking Confirmation Email**:
   - Complete a booking as a new user (using email)
   - Check inbox for confirmation email
   - Verify email contains: service name, stylist, date/time, reschedule/cancel buttons
   - Test reschedule and cancel links work

### Automated Tests

> [!NOTE]
> No automated tests for auth/email flows. Manual testing recommended.

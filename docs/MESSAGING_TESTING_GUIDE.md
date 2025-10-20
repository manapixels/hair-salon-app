# Messaging Functions Testing Guide

## Overview

This guide covers testing all **20+ messaging functions** across WhatsApp and Telegram integrations, including:
- 4 message types (confirmation, reminder, cancellation, reschedule)
- 8 bot commands with interactive keyboards
- 7 API routes with messaging
- AI chat with function calling

**Current Status:** ❌ No automated tests exist

---

## Quick Start: Essential Checks

### 1. Environment Variables Check

```bash
# Run this to verify all required credentials are set
node scripts/check-messaging-env.js
```

**Required variables:**
```bash
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
TELEGRAM_BOT_TOKEN=your_bot_token
GEMINI_API_KEY=your_gemini_key
CRON_SECRET=your_cron_secret  # Optional
```

### 2. Quick Health Check

```bash
# Test all messaging endpoints
npm run test:messaging
```

---

## Manual Testing Checklist

### A. WhatsApp Testing

#### 1. Basic Message Sending
**Location:** `src/services/messagingService.ts:sendWhatsAppMessage()`

**Test Steps:**
1. Send test message via API:
```bash
curl -X POST http://localhost:3000/api/test/whatsapp-send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "text": "Test message from Luxe Cuts"
  }'
```

**Expected Result:** ✅ Message received on WhatsApp within 5 seconds

---

#### 2. Appointment Confirmation Message
**Location:** `src/services/messagingService.ts:sendAppointmentConfirmation()`

**Test Steps:**
1. Create a new appointment through the booking form at `/`
2. Use WhatsApp login during booking
3. Complete the booking

**Expected Result:** ✅ WhatsApp message with:
- 🎉 "Appointment Confirmed!" header
- Date, time, services, price, duration
- Tip about arriving early
- Proper markdown formatting

---

#### 3. Cancellation Message
**Location:** `src/services/messagingService.ts:sendAppointmentCancellation()`

**Test Steps:**
1. Go to `/dashboard`
2. Cancel an upcoming appointment
3. Confirm cancellation

**Expected Result:** ✅ WhatsApp message with:
- ❌ "Appointment Cancelled" header
- Cancelled appointment details
- "Hope to see you again" message

---

#### 4. Reschedule Message
**Location:** `src/services/messagingService.ts:sendAppointmentConfirmation()` (type: 'reschedule')

**Test Steps:**
1. Go to `/dashboard`
2. Click "Reschedule" on an appointment
3. Select new date/time and confirm

**Expected Result:** ✅ WhatsApp message with:
- 🔄 "Appointment Rescheduled!" header
- New date and time
- Same service details
- Arrival tip

---

#### 5. 24-Hour Reminder
**Location:** `src/services/reminderService.ts:sendAppointmentReminder()`

**Test Steps:**
1. Create appointment for exactly 24 hours from now
2. Manually trigger reminder job:
```bash
curl -X POST http://localhost:3000/api/reminders/send \
  -H "Authorization: Bearer your_cron_secret"
```

**Expected Result:** ✅ WhatsApp message with:
- 🔔 "Appointment Reminder" header
- Tomorrow's appointment details
- Services, stylist, price, duration

**Note:** WhatsApp doesn't support inline keyboards, so no buttons appear

---

#### 6. AI Chat via WhatsApp Webhook
**Location:** `src/app/api/whatsapp/route.ts` + `src/services/geminiService.ts`

**Test Steps:**
1. Configure Meta webhook to point to `https://your-domain.com/api/whatsapp`
2. Send message from WhatsApp: "I want to book a haircut"
3. Follow AI conversation

**Expected Result:** ✅
- AI responds with available services
- AI asks for preferred date/time
- AI confirms booking when info is complete
- Confirmation message sent after booking

---

#### 7. User Context Injection
**Location:** `src/services/messagingUserService.ts:handleMessagingWithUserContext()`

**Test Steps:**
1. Send WhatsApp message: "Show my appointments"
2. Verify AI has access to user email

**Expected Result:** ✅
- AI knows your email (doesn't ask)
- AI can fetch your appointments
- Response includes your actual bookings

---

### B. Telegram Testing

#### 1. Basic Message Sending
**Location:** `src/services/messagingService.ts:sendTelegramMessage()`

**Test Steps:**
1. Get your Telegram chat ID by messaging your bot
2. Send test message:
```bash
curl -X POST http://localhost:3000/api/test/telegram-send \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": 123456789,
    "text": "Test message from Luxe Cuts"
  }'
```

**Expected Result:** ✅ Message received in Telegram within 5 seconds

---

#### 2. Message with Inline Keyboard
**Location:** `src/services/messagingService.ts:sendTelegramMessageWithKeyboard()`

**Test Steps:**
1. Send `/start` command to your bot

**Expected Result:** ✅ Message with inline buttons:
- 📅 Book Appointment
- 📋 My Appointments
- ✂️ View Services
- 🕐 Business Hours
- ❌ Cancel Appointment
- 🔄 Reschedule
- ℹ️ Help

---

#### 3. Bot Commands

| Command | Test Action | Expected Buttons |
|---------|-------------|------------------|
| `/start` | Send command | Book, Appointments, Services, Hours, Cancel, Reschedule, Help |
| `/services` | Send command | "Book [Service]" button for each service |
| `/book` | Send command | Popular services + "View All Services" |
| `/appointments` | Send command | Reschedule/Cancel buttons for each appointment |
| `/cancel` | Send command | Cancel button for each appointment |
| `/reschedule` | Send command | Reschedule button for each appointment |
| `/hours` | Send command | Call Us, Get Directions, Book Appointment |
| `/help` | Send command | Book Now, My Appointments, Services |

**Test Steps:**
1. Send each command to your Telegram bot
2. Verify buttons appear correctly
3. Click each button to test callback handlers

---

#### 4. Callback Query Handlers
**Location:** `src/services/botCommandService.ts:handleCallbackQuery()`

**Test Scenarios:**

| Button Clicked | Expected Behavior |
|----------------|-------------------|
| `book_service_[id]` | Shows available dates/stylists |
| `view_all_services` | Lists all services with prices |
| `cancel_appointment_[id]` | Confirms cancellation → sends cancel message |
| `reschedule_appointment_[id]` | Shows available dates → sends reschedule message |
| `confirm_reminder_[id]` | Updates appointment status |
| `reschedule_reminder_[id]` | Opens reschedule flow |
| `cancel_reminder_[id]` | Cancels appointment |

**Test Steps:**
1. Click each button type
2. Verify correct response
3. Check database updates
4. Verify follow-up messages sent

---

#### 5. Login Flow
**Location:** `src/app/api/telegram/webhook/route.ts` (handles `/start login_TOKEN`)

**Test Steps:**
1. Go to `/` and select Telegram login
2. Click "Continue with Telegram"
3. Copy the `/start login_XXX` command
4. Send command to your bot

**Expected Result:** ✅
- Bot verifies token (valid for 10 minutes)
- Bot sends clickable login link
- Clicking link logs you into the website
- Session cookie created

---

#### 6. Reminder with Interactive Buttons
**Location:** `src/services/reminderService.ts:formatReminderMessage()`

**Test Steps:**
1. Create appointment for 24 hours from now
2. Trigger reminder:
```bash
curl -X POST http://localhost:3000/api/reminders/send \
  -H "Authorization: Bearer your_cron_secret"
```

**Expected Result:** ✅ Telegram message with:
- 🔔 Reminder header
- Appointment details
- 3 inline buttons:
  - ✅ I'll Be There
  - 🔄 Reschedule
  - ❌ Cancel Appointment
- Buttons work when clicked

---

#### 7. Natural Language AI Chat
**Location:** `src/services/geminiService.ts` via webhook

**Test Steps:**
1. Send message (not a command): "I want a haircut tomorrow"
2. Follow conversation

**Expected Result:** ✅
- AI understands request
- AI offers service options with buttons
- AI asks for time
- AI completes booking
- Confirmation message sent

---

### C. Cross-Platform Testing

#### 1. User Lookup by Platform
**Functions:**
- `findUserByWhatsAppPhone()`
- `findUserByTelegramId()`

**Test Steps:**
1. Create account via WhatsApp OAuth
2. Send WhatsApp message → verify user found
3. Create another account via Telegram OAuth
4. Send Telegram message → verify user found

**Expected Result:** ✅ Each platform correctly identifies users

---

#### 2. Conversation History
**Location:** `src/services/conversationHistory.ts`

**Test Steps:**
1. Send 5 messages to AI via WhatsApp
2. Check conversation stored:
```bash
# Add a debug endpoint to view history
curl http://localhost:3000/api/test/conversation-history?userId=USER_ID
```

**Expected Result:** ✅
- Last 5 messages stored
- Correct sender attribution (user/bot)
- Timestamp recorded

---

#### 3. Booking Context Persistence
**Location:** `src/services/conversationHistory.ts:setBookingContext()`

**Test Steps:**
1. Click "Book Men's Haircut" button in Telegram
2. AI asks for date
3. Provide date
4. Verify AI doesn't ask for service again

**Expected Result:** ✅
- Context includes `services: ["Men's Haircut"]`
- AI proceeds directly to date selection
- Context clears after 30 minutes of inactivity

---

#### 4. Context Timeout (30 minutes)
**Test Steps:**
1. Start booking conversation
2. Wait 31 minutes
3. Send another message

**Expected Result:** ✅
- Old context cleared
- New conversation starts fresh
- No booking data carried over

---

### D. API Route Testing

#### 1. Reminders Job (Cron)
**Route:** `POST /api/reminders/send`

**Test Steps:**
```bash
# Check upcoming reminders (GET)
curl http://localhost:3000/api/reminders/send

# Trigger reminder job (POST)
curl -X POST http://localhost:3000/api/reminders/send \
  -H "Authorization: Bearer your_cron_secret"
```

**Expected Result:** ✅
- GET shows appointments needing reminders
- POST sends reminders to all users
- Response includes success/failure stats
- Database updated with `reminderSent: true`

---

#### 2. Reminder Test Endpoint
**Route:** `POST /api/reminders/test`

**Test Steps:**
```bash
# Test specific appointment
curl -X POST http://localhost:3000/api/reminders/test \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "your-appointment-id",
    "userId": "your-user-id"
  }'

# Test format only (no send)
curl -X POST http://localhost:3000/api/reminders/test \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Result:** ✅
- Reminder message sent to user
- Formatted message preview returned
- No database changes

---

#### 3. WhatsApp Webhook Verification
**Route:** `GET /api/whatsapp`

**Test Steps:**
```bash
curl "http://localhost:3000/api/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=your_verify_token"
```

**Expected Result:** ✅ Returns `test123` (the challenge)

---

#### 4. WhatsApp Webhook Message Handling
**Route:** `POST /api/whatsapp`

**Test Steps:**
1. Configure Meta webhook
2. Send message from WhatsApp
3. Check server logs

**Expected Result:** ✅
- Webhook receives message
- AI processes message
- Response sent back to user
- Logged in terminal

---

#### 5. Telegram Webhook
**Route:** `POST /api/telegram/webhook`

**Test Steps:**
1. Set Telegram webhook:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-domain.com/api/telegram/webhook"
```
2. Send message to bot
3. Check server logs

**Expected Result:** ✅
- Webhook receives update
- Message/callback processed
- Response sent to Telegram
- Logged in terminal

---

### E. AI Function Calling Tests

**Location:** `src/services/geminiService.ts` (tool declarations)

| Function | Test Input | Expected AI Action |
|----------|------------|-------------------|
| `getServicesList` | "What services do you offer?" | Calls function → returns all services with prices |
| `checkAvailability` | "Do you have slots on Oct 25?" | Calls function → shows available times |
| `bookAppointment` | "Book Men's Haircut for Oct 25 at 2pm" | Calls function → creates appointment → sends confirmation |
| `listMyAppointments` | "Show my appointments" | Calls function → lists user's bookings |
| `cancelAppointment` | "Cancel my appointment on Oct 25" | Calls function → cancels → sends cancellation message |
| `modifyAppointment` | "Change my appointment to 3pm" | Calls function → reschedules → sends reschedule message |

**Test Steps:**
1. Send each test input via WhatsApp/Telegram
2. Monitor logs for function call
3. Verify correct function executed
4. Check database changes
5. Verify follow-up message sent

---

## Automated Testing Setup

### Step 1: Create Test Utilities

```bash
# Create test directory
mkdir -p src/__tests__/messaging
mkdir -p src/__tests__/utils
```

### Step 2: Install Testing Dependencies

```bash
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev nock  # For mocking HTTP requests
```

### Step 3: Run Test Suite

```bash
# Unit tests
npm run test:messaging:unit

# Integration tests
npm run test:messaging:integration

# E2E tests
npm run test:messaging:e2e
```

---

## Common Issues & Troubleshooting

### Issue: WhatsApp messages not sending

**Check:**
1. `WHATSAPP_ACCESS_TOKEN` is valid (check Meta Business Manager)
2. `WHATSAPP_PHONE_NUMBER_ID` is correct
3. Phone number is in correct format (+1234567890)
4. Check API response in logs

**Debug:**
```bash
# Enable debug logging
DEBUG=whatsapp:* npm run dev
```

---

### Issue: Telegram messages not sending

**Check:**
1. `TELEGRAM_BOT_TOKEN` is valid
2. Chat ID is a number (not string)
3. Bot hasn't been blocked by user
4. Telegram API is reachable

**Debug:**
```bash
# Test bot token
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
```

---

### Issue: AI not responding

**Check:**
1. `GEMINI_API_KEY` is valid
2. Check Gemini API quota
3. User input is being received
4. Check conversation history

**Debug:**
```bash
# Check Gemini API
curl "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

---

### Issue: Reminders not sending

**Check:**
1. Appointment is exactly 24 hours ahead
2. `reminderSent` is false
3. User has WhatsApp or Telegram provider
4. Cron job is running

**Debug:**
```bash
# Check appointments needing reminders
curl http://localhost:3000/api/reminders/send

# Manually trigger
curl -X POST http://localhost:3000/api/reminders/send \
  -H "Authorization: Bearer your_cron_secret"
```

---

### Issue: Buttons not working in Telegram

**Check:**
1. Callback data format is correct
2. `handleCallbackQuery()` is being called
3. Callback data matches expected pattern
4. No errors in webhook handler

**Debug:**
Add logging to `handleCallbackQuery()`:
```typescript
console.log('Callback data received:', callbackData);
```

---

### Issue: User context not found

**Check:**
1. User is authenticated
2. Phone number format matches database
3. Telegram ID matches database
4. User exists in database

**Debug:**
```bash
# Check user in database
npx prisma studio
# Navigate to User table and search by phone/telegramId
```

---

## Performance Testing

### Load Test: Bulk Reminders

**Test Scenario:** Send 100 reminders simultaneously

```bash
# Create 100 appointments for tomorrow
node scripts/create-test-appointments.js --count 100

# Trigger reminder job
time curl -X POST http://localhost:3000/api/reminders/send \
  -H "Authorization: Bearer your_cron_secret"
```

**Expected:**
- All 100 sent within 2 minutes (1s delay each)
- No rate limit errors
- Success rate > 95%

---

### Load Test: Concurrent Webhook Messages

**Test Scenario:** 50 WhatsApp messages in 10 seconds

```bash
# Use Apache Bench or similar
ab -n 50 -c 10 -p whatsapp-payload.json \
  -T "application/json" \
  http://localhost:3000/api/whatsapp
```

**Expected:**
- All messages processed
- No timeouts
- Conversation history maintained
- Response time < 2s per message

---

## Security Testing

### 1. Webhook Token Validation

**Test Steps:**
```bash
# WhatsApp webhook with wrong token
curl "http://localhost:3000/api/whatsapp?hub.mode=subscribe&hub.challenge=test&hub.verify_token=wrong"

# Expected: 403 Forbidden
```

---

### 2. Cron Secret Authorization

**Test Steps:**
```bash
# Without authorization header
curl -X POST http://localhost:3000/api/reminders/send

# With wrong secret
curl -X POST http://localhost:3000/api/reminders/send \
  -H "Authorization: Bearer wrong_secret"

# Expected: 401 Unauthorized
```

---

### 3. Input Sanitization

**Test Steps:**
Send malicious inputs:
```json
{
  "userInput": "<script>alert('xss')</script>",
  "userInput": "'; DROP TABLE appointments; --",
  "userInput": "../../../../etc/passwd"
}
```

**Expected:** All sanitized, no code execution, no SQL injection

---

## Monitoring & Logging

### Production Monitoring Checklist

- [ ] WhatsApp API error rate < 1%
- [ ] Telegram API error rate < 1%
- [ ] AI response time < 3s average
- [ ] Reminder success rate > 95%
- [ ] Webhook uptime > 99.9%
- [ ] Message delivery rate > 98%

### Recommended Logging

```typescript
// Add to all messaging functions
console.log('[WhatsApp] Sending message to:', phoneNumber);
console.log('[Telegram] Callback received:', callbackData);
console.log('[AI] Function called:', functionName, params);
console.log('[Reminder] Sent to user:', userId, 'Result:', success);
```

---

## Test Completion Checklist

### WhatsApp
- [ ] Basic message sending works
- [ ] Confirmation messages received
- [ ] Cancellation messages received
- [ ] Reschedule messages received
- [ ] 24-hour reminders sent
- [ ] AI chat responds correctly
- [ ] User context injected
- [ ] Webhook verification works
- [ ] Webhook receives messages

### Telegram
- [ ] Basic message sending works
- [ ] Messages with keyboards work
- [ ] All 8 bot commands work
- [ ] Inline buttons render correctly
- [ ] Callback handlers work
- [ ] Login flow works end-to-end
- [ ] Reminders with buttons sent
- [ ] AI chat responds correctly
- [ ] Webhook configured properly

### AI & Context
- [ ] Gemini API connected
- [ ] All 6 function calls work
- [ ] Conversation history stored
- [ ] Booking context persists
- [ ] Context timeout works (30min)
- [ ] User context injection works
- [ ] Service name matching works

### API Routes
- [ ] Reminder cron job works
- [ ] Reminder test endpoint works
- [ ] All appointment routes send messages
- [ ] Webhooks secured properly
- [ ] Error handling graceful

### Integration
- [ ] Booking → Confirmation flow
- [ ] Cancel → Notification flow
- [ ] Reschedule → Notification flow
- [ ] Reminder → Interactive buttons flow
- [ ] Cross-platform user lookup
- [ ] Database updates on actions

---

## Next Steps

1. **Add automated tests** (currently none exist)
2. **Set up CI/CD testing** in GitHub Actions
3. **Configure monitoring** (Sentry, DataDog, etc.)
4. **Create E2E test suite** with Playwright
5. **Add webhook retry logic** for failed deliveries
6. **Implement message queue** (Redis/Bull) for high volume

---

## Summary

**Total Test Cases:** 50+
**Estimated Testing Time:** 2-3 hours for full manual suite
**Platforms:** WhatsApp, Telegram, AI Chat
**Message Types:** 4 (confirmation, reminder, cancellation, reschedule)
**Bot Commands:** 8
**API Endpoints:** 7

**Status:** ❌ No automated tests ✅ Manual testing guide complete

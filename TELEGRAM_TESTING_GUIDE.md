# Telegram Bot Testing Guide

## Phase 1 Feature Testing - Complete UX Flow

This guide covers end-to-end testing of all Phase 1 UX improvements.

---

## 🎯 Test Environment Setup

### Prerequisites
1. Telegram bot token set in `.env`: `TELEGRAM_BOT_TOKEN=your_token`
2. Webhook configured and pointing to your server
3. Database accessible with test data
4. At least one test user registered via Telegram login

### Quick Setup Commands
```bash
# Start dev server
npm run dev

# In another terminal, verify webhook
node scripts/setup-telegram-webhook.js

# Check webhook status
curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo
```

---

## 📋 Test Scenarios

### **Test 1: Booking Flow with Button Confirmation** ✅

**Purpose:** Verify the complete booking flow with service selection and confirmation buttons

**Steps:**
1. Open Telegram and message your bot: `/start`
2. Click **[📅 Book Appointment]**
3. Click one of the service buttons, e.g., **[✂️ Men's Haircut - $30]**
4. Bot should respond with service details and ask for date/time
5. Type: `"October 20th at 2:00 PM"`
6. Bot should ask: "Does that sound correct?" with **[✅ Yes, book it!]** button
7. Click **[✅ Yes, book it!]**
8. Bot should immediately show: "✅ Booking Confirmed!" with appointment details
9. Verify you see **[📋 View My Appointments]** and **[📅 Book Another]** buttons

**Expected Results:**
- ✅ Service stored in booking context when button clicked
- ✅ AI extracts date/time from natural language
- ✅ Confirmation shows Yes/No buttons
- ✅ Clicking "Yes" completes booking immediately (no typing required)
- ✅ Success message shows all appointment details
- ✅ Booking appears in database
- ✅ Email confirmation sent (if configured)

**Edge Cases to Test:**
- Type invalid date format → Should ask to retry
- Click "❌ No, let me change something" → Should allow modifications
- Wait 31+ minutes between steps → Context should expire, ask to start over

---

### **Test 2: View Appointments with Per-Appointment Actions** ✅

**Purpose:** Verify appointment list shows action buttons for each appointment

**Steps:**
1. Message bot: `/appointments`
2. Verify each appointment has its own action buttons
3. Look for format:
   ```
   1. Oct 14 at 2pm
   ✂️ Men's Haircut
   [🔄 Oct 14 - Men's Haircut] [❌ Cancel]

   2. Oct 20 at 3pm
   ✂️ Color
   [🔄 Oct 20 - Color] [❌ Cancel]
   ```
4. Click **[❌ Cancel]** for the first appointment
5. Should show confirmation dialog for that specific appointment
6. Click **[✅ Yes, Cancel It]**
7. Verify cancellation succeeds

**Expected Results:**
- ✅ Each appointment has dedicated action buttons
- ✅ Clicking cancel/reschedule acts on correct appointment (no ambiguity)
- ✅ No generic buttons that require second selection
- ✅ "Book Another" button shown at bottom

---

### **Test 3: Cancel Appointment Flow** ✅

**Purpose:** Verify cancel flow with appointment-specific buttons

**Steps:**
1. Message bot: `/cancel`
2. Verify list shows all appointments with cancel buttons
3. Click **[❌ Oct 14 at 2pm - Men's Haircut]**
4. Should show confirmation: "⚠️ Are you sure?"
5. Should show **[✅ Yes, Cancel It]** and **[❌ No, Keep It]**
6. Click **[✅ Yes, Cancel It]**
7. Verify appointment is canceled in database
8. Verify cancellation confirmation message shown

**Expected Results:**
- ✅ Each appointment has its own cancel button
- ✅ Clicking button shows confirmation for correct appointment
- ✅ Two-step confirmation prevents accidental cancellations
- ✅ Database updated on confirmation
- ✅ User gets success message

---

### **Test 4: Reschedule Appointment Flow** ✅

**Purpose:** Verify reschedule flow with appointment-specific buttons

**Steps:**
1. Message bot: `/reschedule`
2. Verify list shows all appointments with reschedule buttons
3. Click **[🔄 Oct 14 at 2pm - Men's Haircut]**
4. Bot asks: "Please tell me your preferred new date and time"
5. Type: `"October 25th at 3:00 PM"`
6. Verify AI processes the request and updates appointment
7. Check database for updated date/time

**Expected Results:**
- ✅ Each appointment has its own reschedule button
- ✅ Clicking button correctly identifies which appointment to modify
- ✅ Natural language date/time parsing works
- ✅ Appointment updated in database
- ✅ Calendar event updated (if Google Calendar configured)
- ✅ Email notification sent

---

### **Test 5: Service Selection from /services** ✅

**Purpose:** Verify service list has direct booking buttons

**Steps:**
1. Message bot: `/services`
2. Verify each service has a booking button:
   ```
   ✂️ Men's Haircut - $30
   ⏱️ 30 minutes
   Classic cut

   [📅 Book Men's Haircut - $30]
   ```
3. Click **[📅 Book Men's Haircut - $30]**
4. Verify service is pre-selected in booking flow
5. Continue with date/time entry
6. Complete booking

**Expected Results:**
- ✅ Each service has a direct "Book" button
- ✅ Clicking button starts booking with service pre-filled
- ✅ Reduces steps from 2 (view → type) to 1 (click)

---

### **Test 6: Context Persistence** ✅

**Purpose:** Verify booking context is stored and retrieved correctly

**Steps:**
1. Start booking: Click **[✂️ Women's Haircut - $60]**
2. Verify bot confirms service selection
3. Type: `"October 15th at 11:00 AM"`
4. Bot asks for confirmation
5. Check internal state (if you have access to logs):
   - Booking context should contain: service, date, time, customer info
6. Click **[✅ Yes, book it!]**
7. Verify booking completes with correct details

**Expected Results:**
- ✅ Service stored when button clicked
- ✅ Date/time extracted from AI response
- ✅ Customer name/email pulled from user context
- ✅ All details persisted until booking completes
- ✅ Context cleared after successful booking

---

### **Test 7: Context Expiration** ⏰

**Purpose:** Verify booking context expires after 30 minutes

**Steps:**
1. Start booking: Click service button
2. Wait 31 minutes (or modify `CONVERSATION_TIMEOUT_MS` in code to 1 minute for faster testing)
3. Try to continue booking
4. Verify bot says: "I seem to have lost the booking details. Let's start over."

**Expected Results:**
- ✅ Context expires after 30 minutes
- ✅ Graceful error message shown
- ✅ User can start new booking

---

### **Test 8: Missing User Information** ⚠️

**Purpose:** Verify booking handles missing user email/name

**Steps:**
1. Use a Telegram account that hasn't logged in to the web app
2. Start booking flow
3. Select service and provide date/time
4. When AI asks for confirmation, click **[✅ Yes, book it!]**
5. Bot should respond: "I need your name and email to complete the booking"

**Expected Results:**
- ✅ Bot detects missing user info
- ✅ Clear error message shown
- ✅ User prompted to provide details

---

### **Test 9: Invalid Date Formats** ⚠️

**Purpose:** Verify date parsing handles various formats

**Test Inputs:**
- `"tomorrow at 2pm"` ✅ Should work
- `"October 20th at 2:00 PM"` ✅ Should work
- `"10/20/2025 2pm"` ✅ Should work
- `"asdfghjkl"` ❌ Should show error
- `"February 30th"` ❌ Should show error (invalid date)

**Expected Results:**
- ✅ Valid formats parsed correctly
- ✅ Invalid formats show helpful error
- ✅ User asked to retry with valid date

---

### **Test 10: Concurrent Booking Prevention** 🚨

**Purpose:** Verify system handles slot conflicts

**Steps:**
1. Check available slots for a date
2. Start booking flow for a slot
3. In another Telegram account, book the same slot faster
4. Complete your original booking
5. Should show error: "This time slot is no longer available"

**Expected Results:**
- ✅ Database-level constraint prevents double-booking
- ✅ Clear error message shown
- ✅ User prompted to select different time

---

### **Test 11: Button Click vs. Typing** 📊

**Purpose:** Verify users prefer buttons over typing

**Metrics to Track:**
- % of bookings completed via buttons vs. typing
- Average time to complete booking (button path vs. typing path)
- Drop-off rate at each step

**Expected Results:**
- ✅ Most users use buttons (>80%)
- ✅ Button path is faster (~30-50% time reduction)
- ✅ Lower drop-off rate with buttons

---

## 🐛 Bug Tracking

### Known Issues
_(Add any bugs discovered during testing)_

| Bug ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| - | - | - | - |

---

## ✅ Test Sign-Off Checklist

Before declaring Phase 1 complete, verify:

- [ ] All 11 test scenarios pass
- [ ] No critical bugs found
- [ ] Button click rate >70% (vs. typing)
- [ ] Booking completion rate >80%
- [ ] Average booking time <2 minutes
- [ ] Context expiration works correctly
- [ ] Database constraints prevent double-booking
- [ ] Email confirmations sent successfully
- [ ] Calendar events created (if configured)
- [ ] Error messages are clear and helpful

---

## 📊 Test Results Template

```markdown
## Test Session: [Date]
**Tester:** [Name]
**Environment:** [Dev/Staging/Production]

### Test 1: Booking Flow
- Status: ✅ PASS / ❌ FAIL
- Notes: _____________________

### Test 2: View Appointments
- Status: ✅ PASS / ❌ FAIL
- Notes: _____________________

[... continue for all tests ...]

### Summary
- Tests Passed: X/11
- Critical Issues: X
- Minor Issues: X
- Blocker Issues: X
```

---

## 🔧 Debugging Tips

### Check Booking Context
```typescript
// Add temporary logging in botCommandService.ts
const context = getBookingContext(userId);
console.log('Current booking context:', JSON.stringify(context, null, 2));
```

### Check Telegram Webhook Logs
```bash
# View webhook delivery status
curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo

# Check for pending updates
curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates
```

### Database Inspection
```bash
# Connect to database
npx prisma studio

# Or run SQL directly
psql $DATABASE_URL
SELECT * FROM appointments WHERE "customerEmail" = 'test@example.com';
```

### Clear Context Manually
```typescript
// In Node.js console or temporary endpoint
import { clearHistory, clearBookingContext } from './src/services/conversationHistory';
clearHistory('TELEGRAM_CHAT_ID');
clearBookingContext('TELEGRAM_CHAT_ID');
```

---

## 📈 Success Metrics

After Phase 1 deployment, track:

1. **Completion Rate**: % of /book commands that result in confirmed bookings
   - Target: >80%

2. **Button Click Rate**: % of interactions using buttons vs. typing
   - Target: >70%

3. **Average Time to Book**: From /book to confirmation
   - Target: <2 minutes

4. **Drop-off Points**: Where users abandon the flow
   - Most common: After service selection (missing date/time guidance)

5. **Error Rate**: Failed bookings, invalid inputs
   - Target: <10%

---

## 🚀 Next Steps After Phase 1

Once all tests pass:
1. Update TELEGRAM_UX_REVIEW.md to mark Phase 1 as complete
2. Deploy to production
3. Monitor metrics for 1 week
4. Begin Phase 2: Stylist selection, dynamic business hours

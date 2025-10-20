# Messaging Functions - Quick Start Testing Guide

## 🚀 Quick Validation (5 minutes)

### Step 1: Check Environment Variables

```bash
npm run test:messaging:env
```

**Expected:** ✅ All required variables configured

**If failed:** Add missing variables to `.env.local`

---

### Step 2: Start Development Server

```bash
npm run dev
```

---

### Step 3: Test Basic Sending

#### Option A: WhatsApp

```bash
curl -X POST http://localhost:3000/api/test/whatsapp-send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "text": "Test from Luxe Cuts"
  }'
```

**Expected:** Message received on WhatsApp within 5 seconds

---

#### Option B: Telegram

First, get your chat ID:
```bash
# Send a message to your bot, then run:
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

Then send a test message:
```bash
curl -X POST http://localhost:3000/api/test/telegram-send \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": 123456789,
    "text": "Test from Luxe Cuts"
  }'
```

**Expected:** Message received in Telegram within 5 seconds

---

### Step 4: Test End-to-End Booking Flow

1. **Go to:** http://localhost:3000
2. **Click:** "Continue with WhatsApp" or "Continue with Telegram"
3. **Complete login**
4. **Book an appointment**
5. **Check your messaging app**

**Expected:** Confirmation message with appointment details

---

### Step 5: Test Bot Commands (Telegram Only)

Send these commands to your Telegram bot:

```
/start
/services
/book
/appointments
```

**Expected:** Interactive messages with clickable buttons

---

### Step 6: Test Reminders

```bash
# Create test appointments for tomorrow
npm run test:appointments:create -- --count=3

# Check which appointments need reminders
curl http://localhost:3000/api/reminders/send

# Send reminders
curl -X POST http://localhost:3000/api/reminders/send \
  -H "Authorization: Bearer your_cron_secret"
```

**Expected:** Reminder messages received for tomorrow's appointments

---

## 📋 Full Test Checklist

### WhatsApp Functions (7 tests)

- [ ] Basic message sending works
- [ ] Booking confirmation received
- [ ] Cancellation message received
- [ ] Reschedule message received
- [ ] 24-hour reminder received
- [ ] AI chat responds to natural language
- [ ] Webhook receives incoming messages

### Telegram Functions (10 tests)

- [ ] Basic message sending works
- [ ] `/start` command shows menu
- [ ] `/services` lists all services
- [ ] `/book` starts booking flow
- [ ] `/appointments` shows user's bookings
- [ ] Inline buttons work when clicked
- [ ] Reminder with action buttons received
- [ ] Login flow works (`/start login_TOKEN`)
- [ ] AI chat responds to natural language
- [ ] Callback queries update appointments

### AI & Integration (6 tests)

- [ ] AI suggests services correctly
- [ ] AI books appointments
- [ ] AI cancels appointments
- [ ] AI shows user's appointments
- [ ] Conversation context persists (< 30min)
- [ ] User context (email) injected automatically

---

## 🛠️ Interactive Testing Tool

For a guided testing experience:

```bash
npm run test:messaging
```

This launches an interactive menu where you can:
1. Check environment variables
2. Send test WhatsApp messages
3. Send test Telegram messages
4. Check upcoming reminders
5. Trigger reminder sending
6. Verify webhook setup

---

## 🐛 Common Issues

### WhatsApp messages not sending

**Fix:**
1. Check `WHATSAPP_ACCESS_TOKEN` hasn't expired (Meta Business Suite)
2. Verify phone number format: `+1234567890` (no spaces/dashes)
3. Ensure number is registered as a test recipient in Meta

---

### Telegram messages not sending

**Fix:**
1. Check bot token is valid: `curl https://api.telegram.org/bot<TOKEN>/getMe`
2. Ensure chat ID is a number (not string)
3. Send `/start` to your bot first (initiates conversation)

---

### AI not responding

**Fix:**
1. Check `GEMINI_API_KEY` is valid
2. Verify you're not hitting quota limits
3. Check server logs for Gemini API errors

---

### Reminders not sending

**Fix:**
1. Appointment must be exactly 24 hours ahead
2. `reminderSent` must be `false` in database
3. User must have WhatsApp or Telegram auth provider
4. Check server logs for errors

---

## 📊 Test Coverage

| Category | Functions | Test Status |
|----------|-----------|-------------|
| WhatsApp Core | 3 | Manual ✅ |
| Telegram Core | 5 | Manual ✅ |
| Bot Commands | 8 | Manual ✅ |
| AI Functions | 6 | Manual ✅ |
| API Routes | 7 | Manual ✅ |
| **Total** | **29** | **Automated ❌** |

**Note:** No automated tests exist yet. All testing is currently manual.

---

## 📚 Full Documentation

For comprehensive testing scenarios, see:
- [Full Testing Guide](./MESSAGING_TESTING_GUIDE.md)
- Scripts: `/scripts/test-messaging.js`, `/scripts/check-messaging-env.js`
- API Routes: `/src/app/api/test/`

---

## 🎯 Next Steps

After validating all functions work:

1. **Add automated tests** (Jest + integration tests)
2. **Set up monitoring** (error tracking, message delivery rates)
3. **Configure webhooks** in production
4. **Set up reminder cron job** (GitHub Actions already configured)
5. **Load test** bulk reminder sending

---

## ✅ Success Criteria

Your messaging system is working correctly when:

- ✅ Both WhatsApp and Telegram send messages successfully
- ✅ All appointment types trigger correct messages
- ✅ AI chat understands and responds to natural language
- ✅ Bot commands work with interactive buttons
- ✅ Reminders are sent 24 hours before appointments
- ✅ User context is automatically injected
- ✅ Webhooks receive and process incoming messages

---

**Need help?** Check the full testing guide or server logs for detailed error messages.

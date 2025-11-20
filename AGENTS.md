# AGENTS.md

**Signature Trims AI Agents** - Comprehensive guide to AI/bot systems powering automated booking, customer engagement, and retention.

---

## 🤖 Agent Architecture Overview

```
AI Layer:
├── Gemini AI Service     # Natural language → function calls
├── Telegram Bot          # Command-based booking interface
├── WhatsApp Chat         # Customer support & booking
├── NLU Helpers           # Service aliases, datetime parsing
└── Retention Engine      # Automated feedback/rebooking/winback
```

---

## 🧠 1. Gemini AI Service (`src/services/geminiService.ts`)

### **Purpose**

Natural language understanding for booking flows. Converts user messages into structured function calls.

### **Function Declarations**

| Function                | Description                     | Parameters                                          |
| ----------------------- | ------------------------------- | --------------------------------------------------- |
| `getServicesList`       | Fetch available services/prices | None                                                |
| `checkAvailability`     | Check slots for date            | `date` (YYYY-MM-DD)                                 |
| `bookAppointment`       | Create new booking              | `name`, `email`, `services[]`, `date`, `time`       |
| `cancelAppointment`     | Cancel existing appointment     | `email`, `date`, `time`                             |
| `listMyAppointments`    | Get user's appointments         | `email`                                             |
| `rescheduleAppointment` | Change appointment datetime     | `email`, `oldDate`, `oldTime`, `newDate`, `newTime` |

### **Usage Pattern**

```typescript
// User message → Gemini → Function call → DB operation → Response
const response = await ai.generateContent({
  messages: conversationHistory,
  tools: [{ functionDeclarations }],
});

if (response.functionCall) {
  const result = await executeFunctionCall(response.functionCall);
  // Return structured response to user
}
```

### **Key Features**

- ✅ Multi-turn conversation support
- ✅ Context-aware responses
- ✅ Automatic service name matching
- ✅ Handles ambiguity with clarifying questions
- ✅ User-friendly datetime formatting (`formatDisplayDate`, `formatTime12Hour`)

### **Integration Points**

- **WhatsApp Chat**: `/api/chat` endpoint
- **Telegram Bot**: Inline queries, natural language commands
- **Database**: Direct read/write via `src/lib/database.ts`
- **Messaging**: Auto-confirmations via `messagingService.ts`

---

## 📱 2. Telegram Bot (`src/services/botCommandService.ts`)

### **Purpose**

Command-based interface for booking, viewing, and managing appointments via Telegram.

### **Bot Commands**

| Command       | Description             | Flow                         |
| ------------- | ----------------------- | ---------------------------- |
| `/start`      | Initialize bot session  | Welcome + main menu          |
| `/book`       | Start booking flow      | Service → Stylist → DateTime |
| `/myappts`    | List user appointments  | Upcoming + past appointments |
| `/cancel`     | Cancel appointment      | Select appointment → Confirm |
| `/reschedule` | Change appointment      | Select appt → New datetime   |
| `/help`       | Show available commands | Command list                 |

### **Conversation Flow**

```
/book
  ↓
Select Service (multi-select supported)
  ↓
Select Stylist (filtered by service)
  ↓
Select Date (calendar picker)
  ↓
Select Time (available slots only)
  ↓
Confirm Booking
  ↓
Confirmation Message (WhatsApp/Telegram)
```

### **State Management**

- Uses `conversationHistory.ts` for multi-step flows
- Tracks: `userId`, `currentStep`, `selectedServices`, `selectedDate`, `selectedTime`
- Session timeout: 15 minutes of inactivity

### **Best Practices**

- ✅ **Back button navigation** - Every step has "← Back" option
- ✅ **Input validation** - Real-time availability checks
- ✅ **Error recovery** - Clear messages + retry options
- ✅ **Confirmation steps** - Always confirm before booking/canceling

### **Setup**

```bash
# Set webhook (production)
node scripts/setup-telegram-webhook.js

# Test commands
See ../telegram/TELEGRAM_TESTING_GUIDE.md
```

---

## 🗣️ 3. WhatsApp Chat (`src/components/WhatsAppChat.tsx`)

### **Purpose**

Web-based chat widget using Gemini AI for natural language booking.

### **Features**

- Real-time conversation with AI
- Service recommendations
- Availability checking
- Multi-service bookings
- Appointment management

### **Usage Flow**

```
User: "I need a haircut tomorrow at 2pm"
  ↓
AI: [checkAvailability] → [bookAppointment]
  ↓
AI: "Confirmed for 18 Oct 2025, 2pm with Sarah"
```

### **Integration**

- **API**: `/api/chat` (POST)
- **AI Service**: `geminiService.ts`
- **Auth**: Optional - links bookings to user if logged in

---

## 🧩 4. NLU Helpers (`src/agents/nlu/`)

### **Purpose**

Utility functions for parsing user input. **Not** separate AI agents.

### **Service Aliases** (`serviceAliases.ts`)

```typescript
const SERVICE_ALIASES = {
  haircut: "Men's Haircut",
  'mens cut': "Men's Haircut",
  trim: "Men's Haircut",
  'womens haircut': "Women's Haircut",
  color: 'Single Process Color',
  highlights: 'Partial Highlights',
  blowout: 'Blowout',
  'blow dry': 'Blowout',
};
```

**Usage**: Internal only - maps user utterances to canonical service names.

### **DateTime Extraction** (Planned)

```typescript
import * as chrono from 'chrono-node';

extractDateTime('tomorrow 3pm');
// → { date: Date, time: "15:00" }
```

---

## 📬 5. Retention Engine

### **Purpose**

Automated messaging for feedback, rebooking, and win-back campaigns.

### **Message Types**

| Type                 | Trigger                   | Timing          | Rate Limit       |
| -------------------- | ------------------------- | --------------- | ---------------- |
| **Feedback Request** | Appointment completed     | +4 hours        | Once per booking |
| **Rebooking Nudge**  | No appointment in 4 weeks | Weekly check    | Max 1/week       |
| **Win-Back**         | No appointment in 8 weeks | Weekly check    | Max 1/week       |
| **Reminder**         | Upcoming appointment      | 24 hours before | Once per booking |

### **Services**

#### **Reminder Service** (`src/services/reminderService.ts`)

- Sends 24-hour reminders via WhatsApp/Telegram
- Triggered by GitHub Actions cron
- Endpoint: `/api/reminders/send`

#### **Messaging Service** (`src/services/messagingService.ts`)

- Unified interface for WhatsApp + Telegram
- Auto-selects channel based on user's auth provider
- Functions:
  - `sendAppointmentConfirmation()`
  - `sendAppointmentReminder()`
  - `sendCancellationConfirmation()`
  - `sendRescheduleConfirmation()`

#### **Retention Services**

- `retentionService.ts` - Identifies users for rebooking/winback
- `retentionMessageService.ts` - Message templates + delivery

### **Configuration** (Planned - `src/config/retention.ts`)

```typescript
export const RETENTION_CONFIG = {
  feedback: { delayHours: 4 },
  rebooking: { weeksSinceVisit: 4 },
  winback: { weeksSinceVisit: 8 },
  rateLimit: { daysBetweenMessages: 7 },
};
```

### **Database Schema** (Prisma)

```prisma
model RetentionMessage {
  id                  String   @id @default(cuid())
  userId              String
  messageType         RetentionMessageType
  daysSinceLastVisit  Int
  sentAt              DateTime @default(now())
  deliveryStatus      String   @default("PENDING") // SENT/FAILED/REPLIED
  deliveryError       String?
}

enum RetentionMessageType {
  FEEDBACK_REQUEST
  REBOOKING_NUDGE
  WIN_BACK
}
```

---

## 🔧 Environment Variables

```bash
# AI & Messaging
GEMINI_API_KEY=your_gemini_api_key
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Optional: WhatsApp Business Phone ID
   const newFunction: FunctionDeclaration = {
     name: 'functionName',
     description: 'Clear description for AI',
     parameters: {
       type: Type.OBJECT,
       properties: {
         /* ... */
       },
       required: ['param1', 'param2'],
     },
   };
```

2. **Implement Handler**

   ```typescript
   case 'functionName':
     const result = await yourDbFunction(args);
     return formatResponseForUser(result);
   ```

3. **Add to Function Registry**
   ```typescript
   tools: [{ functionDeclarations: [..., newFunction] }]
   ```

### **Adding Bot Commands**

1. **Register Command** (Telegram BotFather)

   ```
   /setcommands → Add new command + description
   ```

2. **Implement Handler** (`botCommandService.ts`)

   ```typescript
   case '/newcommand':
     await handleNewCommand(chatId, userId);
     break;
   ```

3. **Update Help Menu**
   ```typescript
   case '/help':
     // Add new command to list
   ```

### **Message Template Guidelines**

✅ **DO:**

- Use `formatDisplayDate()` for dates → "18 Oct 2025"
- Use `formatTime12Hour()` for times → "2pm", "2:30pm"
- Include emojis for visual clarity
- Provide clear CTAs (Call-to-Action)
- Add unsubscribe options for retention messages

❌ **DON'T:**

- Show technical formats (ISO strings, HH:MM)
- Send without rate limiting
- Block user flow during sending
- Forget error handling + retries

### **Testing AI Agents**

```bash
# Unit tests (when implemented)
npm test -- geminiService.test.ts

# Manual testing
# Telegram: See ../telegram/TELEGRAM_TESTING_GUIDE.md
# WhatsApp: Use test business account

# Reminder testing
curl -X POST http://localhost:3000/api/reminders/test
```

---

## 📊 Monitoring & Metrics (Planned)

### **Key Performance Indicators**

- Booking success rate (AI vs manual)
- Function call accuracy (correct intent detection)
- Message delivery success rate
- Feedback response rate
- Rebooking conversion rate
- Win-back conversion rate

### **Error Tracking**

- Failed function calls → Log to DB
- Message delivery failures → Retry via Inngest
- Bot command errors → User-friendly error messages

---

## 🚀 Future Enhancements (See `../implementation-plans/ai-agents-plan.md`)

### **Phase 1: NLU Helpers**

- [ ] DateTime extraction with `chrono-node`
- [ ] Expand service alias dictionary
- [ ] Fuzzy matching for service names

### **Phase 2: Enhanced Reminders**

- [ ] Inngest integration for reliability
- [ ] Dead letter queue for retries
- [ ] Delivery status tracking

### **Phase 3: Retention Logic**

- [ ] Automated feedback requests
- [ ] Smart rebooking suggestions (based on service history)
- [ ] Win-back campaigns with personalized offers

### **Phase 4: Analytics**

- [ ] AI conversation metrics dashboard
- [ ] Bot command usage analytics
- [ ] Retention campaign ROI tracking

---

## 🔗 Related Files

- **Implementation Plan**: `../implementation-plans/ai-agents-plan.md`
- **Design System**: `../design/DESIGN_SYSTEM.md` - UI components for chat interfaces
- **Telegram Testing**: `../telegram/TELEGRAM_TESTING_GUIDE.md`
- **Coding Guidelines**: `../../CLAUDE.md`
- **Services Directory**: `../../src/services/`
- **API Routes**: `../../src/app/api/chat/`, `../../src/app/api/telegram/`

---

**Production-ready AI agent system with natural language booking, automated retention, and multi-channel messaging.**

# Messaging & AI Agents

AI booking system with Telegram and WhatsApp integration.

---

## Agent Architecture

```
Incoming Message → [Intent Parser] → (Match?) → Reply
                        ↓ (No Match)
                   [Gemini AI] → [Function Call] → [DB] → Reply
```

**Level 1: Intent Parser** (`src/services/intentParser.ts`)

- Deterministic, rule-based, fastest
- Handles: book, cancel, reschedule, view_appointments, services, hours

**Level 2: Gemini AI** (`src/services/geminiService.ts`)

- LLM fallback for complex/ambiguous queries
- Functions: `bookAppointment`, `cancelAppointment`, `rescheduleAppointment`, `checkAvailability`, `listMyAppointments`

---

## Key Files

| Purpose             | File                                    |
| ------------------- | --------------------------------------- |
| Gemini AI           | `src/services/geminiService.ts`         |
| Intent Parser       | `src/services/intentParser.ts`          |
| Bot Commands        | `src/services/botCommandService.ts`     |
| Conversation State  | `src/services/conversationHistory.ts`   |
| Messaging (unified) | `src/services/messagingService.ts`      |
| Telegram Auth       | `src/app/api/auth/telegram/`            |
| Telegram Webhook    | `src/app/api/telegram/webhook/route.ts` |

---

## Telegram Bot

**Commands**: `/start`, `/book`, `/myappts`, `/cancel`, `/reschedule`, `/help`

**State**: Database-backed (`conversation_sessions`), 30-min timeout, 30s in-memory cache

**Login Flow**: Cross-browser polling to set cookies in original browser, not Telegram's in-app browser. Bot detection prevents preview bot from consuming tokens.

---

## Best Practices

**Message Formatting**:

- `formatDisplayDate()` → "18 Oct 2025"
- `formatTime12Hour()` → "2pm"
- ❌ No ISO strings, no prices in confirmations

**Bot UX**:

- Back button on every step
- Pre-validate before confirmation
- Helpful error messages with resolution suggestions

---

## Retention Engine

| Type      | Trigger            | Timing     |
| --------- | ------------------ | ---------- |
| Reminder  | Upcoming appt      | 24h before |
| Feedback  | Appt completed     | +4 hours   |
| Rebooking | No appt in 4 weeks | Weekly     |
| Win-Back  | No appt in 8 weeks | Weekly     |

**Services**: `reminderService.ts`, `messagingService.ts`, `calendarReminderService.ts`

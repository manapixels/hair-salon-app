# Signature Trims Hair Salon – AI Agent Implementation Plan (v3 – Polished)

## Overview

Optimized, production-first roadmap for Signature Trims salon app AI enhancement. All modules are actionable, testable, robust, and mapped to business value. Retrofits previous feedback for code correctness, delivery reliability, and maintainable future scaling.

---

## Phase 1: NLU Helpers & Integration

### 1. DateTimeExtractor

**Goal:** Parse natural language times reliably.
**Implementation:**

```typescript
import * as chrono from 'chrono-node';

export function extractDateTime(text: string): { date: Date | null; time: string | null } {
  const parsed = chrono.parse(text, new Date(), { forwardDate: true });
  if (parsed.length === 0) return { date: null, time: null };
  const result = parsed[0];
  const date = result.start.date(); // chrono type fix
  const hour = result.start.get('hour');
  const time = hour !== undefined ? `${hour}:${result.start.get('minute') || 0}` : null;
  return { date, time };
}
```

- Build unit tests for all edge cases:

```typescript
describe('DateTimeExtractor', () => {
  it('handles "tomorrow 3pm"', () => {
    const result = extractDateTime('tomorrow 3pm');
    expect(result.time).toBe('15:0');
  });
});
```

### 2. Service Alias Map

**Goal:** Map user utterances to canonical services.
**Implementation:**

```typescript
// src/agents/nlu/serviceAliases.ts
export const SERVICE_ALIASES: Record<string, string> = {
  haircut: "Men's Haircut",
  'mens cut': "Men's Haircut",
  trim: "Men's Haircut",
  'womens haircut': "Women's Haircut",
  'ladies cut': "Women's Haircut",
  color: 'Single Process Color',
  highlights: 'Partial Highlights',
  blowout: 'Blowout',
};

export function lookupService(userInput: string): string | null {
  const lower = userInput.toLowerCase();
  return SERVICE_ALIASES[lower] || null;
}
```

- Only use internally (not Gemini functions).
- Unit tests with historical queries.

### 3. Gemini LLM Orchestration

**Goal:** Use Gemini for function calling on booking flows only. NLU helpers are JS utilities.
**Implementation:**

```typescript
const functionDeclarations = [
  {
    name: 'createBooking',
    description: 'Create a salon appointment with details',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string' },
        time: { type: 'string' },
        service: { type: 'string' },
      },
      required: ['date', 'time', 'service'],
    },
  },
  {
    name: 'getAvailableSlots',
    description: 'Check available slots for a given date/service',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string' },
        service: { type: 'string' },
      },
    },
  },
];
```

- NLU helpers used inside booking function, not as agent layer.

### 4. DB Integration

- Outputs from NLU helpers mapped directly to booking schema.
- **Prisma model:** see full retention/tracking below.

---

## Phase 2: Reminders & Messaging

### 1. Reminder Logic

**Goal:** Timely, personalized messages; delivery reliability.
**Implementation:**

- Use Inngest for background jobs.
- Rate limit: one retention message per user per week.
- Delivery via WhatsApp (Twilio API) + Telegram fallback.

```typescript
// src/services/messageService.ts
export async function sendMessage(userId: string, message: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramId: true, phone: true },
  });
  try {
    if (user?.telegramId) await telegram.sendMessage(user.telegramId, message);
    else if (user?.phone) await twilio.messages.create({ to: user.phone, body: message });
  } catch (error) {
    // Log/send to retry via Inngest dead letter
    await logDeliveryError({ userId, error: error.message });
  }
}
```

### 2. Feedback Flow

**Goal:** Map ratings directly to feedback DB. Capture flow correct end-to-end.

- When user replies (via bot), `/api/feedback` endpoint creates row in Feedback table.

```typescript
// Example Next.js API handler
export async function POST(req) {
  const { appointmentId, rating, comment } = await req.json();
  await prisma.feedback.create({ data: { appointmentId, rating, comment } });
}
```

---

## Phase 3: Retention Logic

### 1. Rebooking Nudges/Win-Back

- Triggers:
  - Rebooking: lastVisit > 4 weeks
  - Win-back: lastVisit > 8 weeks
- Configurable via a central file:

```typescript
// src/config/retention.ts
export const RETENTION_CONFIG = {
  feedback: { delayHours: 4 },
  rebooking: { weeksSinceVisit: 4 },
  winback: { weeksSinceVisit: 8 },
  rateLimit: { daysBetweenMessages: 7 },
} as const;
```

---

## Phase 4: Monitoring & Error Handling

- All delivery attempts tracked (Success/Fail) in RetentionMessage DB.
- Dead letter function (Inngest) retries failed sends.
- KPIs tracked: booking error rate, rebooking %, delivery success, feedback response.

---

## Database Schema (Prisma)

```prisma
model User {
  id                      String   @id @default(cuid())
  name                    String
  email                   String   @unique
  telegramId              String?
  phone                   String?
  lastVisitDate           DateTime?
  totalVisits             Int       @default(0)
  lastRetentionMessageSent DateTime?
  feedback                Feedback[]
  retentionMessages       RetentionMessage[]
  appointments            Appointment[]
}
model Appointment {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  status          AppointmentStatus @default(SCHEDULED)
  completedAt     DateTime?
  feedbackSent    Boolean @default(false)
  feedback        Feedback?
}
enum AppointmentStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
}
model Feedback {
  id            String        @id @default(cuid())
  appointmentId String        @unique
  appointment   Appointment   @relation(fields: [appointmentId], references: [id])
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  rating        Int           // 1-5 stars
  comment       String?
  createdAt     DateTime      @default(now())
}
model RetentionMessage {
  id                  String         @id @default(cuid())
  userId              String
  user                User           @relation(fields: [userId], references: [id])
  messageType         RetentionMessageType
  daysSinceLastVisit  Int
  sentAt              DateTime       @default(now())
  deliveryStatus      String         @default("PENDING") // SENT/FAILED/REPLIED
  deliveryError       String?
}
enum RetentionMessageType {
  FEEDBACK_REQUEST
  REBOOKING_NUDGE
  WIN_BACK
}
```

---

## Message Copy

**Feedback, Rebooking, Win-back:**

- Templates as in v2, but win-back moved to 8 weeks.

---

## Quick Start Checklist

- [ ] Implement and test NLU helpers
- [ ] Update schema and push
- [ ] Integrate Twilio/Telegram
- [ ] Build feedback API handler
- [ ] Add Inngest jobs for reminders, retention
- [ ] Deploy & monitor with delivery/failure tracking

---

## Best Practices

- Minimal abstractions
- Unit + integration tests for all flows
- Always log errors and retry all failed messages
- Central config for timing windows; easy tuning
- Use NLU helpers as utilities, not agents
- Validate production with live users before adding complexity

---

## Summary

Ship robust, error-tolerant, delivery-verified AI agent flows for maximum retention, rebooking, and operational simplicity. Every function is testable, maintainable, failsafe, and supports rapid iteration.

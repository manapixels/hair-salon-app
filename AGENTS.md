# AGENTS.md

**Signature Trims** - Documentation index and quick reference.

> [!TIP]
> This file is an index. All detailed documentation is in the `/docs` folder.

---

## 📚 Documentation Index

| Document                                               | Content                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)           | Multi-role system, navigation, page patterns, server/client components, layouts |
| [docs/database.md](docs/database.md)                   | Drizzle ORM, caching, availability system                                       |
| [docs/development.md](docs/development.md)             | Build commands, testing, deployment, extending the system                       |
| [docs/design.md](docs/design.md)                       | shadcn/ui components, styling, accessibility                                    |
| [docs/messaging.md](docs/messaging.md)                 | AI agents, Telegram bot, WhatsApp chat, intent parser, best practices           |
| [docs/messaging.md](docs/messaging.md)                 | AI agents, Telegram bot, WhatsApp chat, intent parser, best practices           |
| [docs/features/deposits.md](docs/features/deposits.md) | No-show protection, Stripe payments, Inngest integration                        |
| [docs/features/calendar.md](docs/features/calendar.md) | Stylist Google Calendar sync                                                    |
| `src/services/emailService.ts`                         | Resend email integration (magic link, booking confirmations)                    |
| `src/inngest/`                                         | Background functions (appointment confirmation, cleanup unpaid deposits)        |

---

## 🤖 Agent Architecture

```
Incoming Message
    │
    ▼
[Intent Parser] ──(Matched?)──▶ [Execute Command] ──▶ Reply
    │
    │ (No Match)
    ▼
[Gemini AI] ──────▶ [Function Call] ──▶ [DB] ──▶ Reply
```

**Level 1: Intent Parser** - Deterministic, rule-based (fastest)  
**Level 2: Gemini AI** - LLM fallback for complex queries

→ See [docs/messaging.md](docs/messaging.md) for full details.

---

## 🔗 Quick Links

| Resource   | Path              |
| ---------- | ----------------- |
| Services   | `src/services/`   |
| API Routes | `src/app/api/`    |
| Components | `src/components/` |
| Database   | `src/db/`         |
| i18n       | `src/i18n/`       |

---

## ⏰ Timezone Handling

> [!IMPORTANT]
> Always use explicit `timeZone: 'Asia/Singapore'` when formatting times with `useFormatter().dateTime()`.

Cloudflare edge workers run in UTC. Without explicit timezone, times formatted on the server may differ from client expectations causing SSR hydration issues.

**Pattern:**

```tsx
const format = useFormatter();
format.dateTime(date, {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Singapore', // Required for Cloudflare edge
});
```

---

## 💳 Deposit Payment Flow

New users (first appointment) require a deposit. The flow:

1. **BookingForm** creates appointment with `status: PENDING_PAYMENT`
2. **DepositPaymentView** displays inline (not modal) for seamless UX
3. After payment success:
   - Stripe webhook updates deposit status to `PAID`
   - Appointment status updated to `SCHEDULED`
   - **Google Calendar event created** (webhook handles this)
   - Confirmation email sent

> [!NOTE]
> Calendar sync happens in the webhook (`/api/payments/webhook`), not during initial booking.

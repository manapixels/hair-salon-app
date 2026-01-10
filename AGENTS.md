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
| [docs/features/deposits.md](docs/features/deposits.md) | No-show protection, Stripe payments                                             |
| [docs/features/calendar.md](docs/features/calendar.md) | Stylist Google Calendar sync                                                    |
| `src/services/emailService.ts`                         | Resend email integration (magic link, booking confirmations)                    |

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

# Development Guide

---

## Build Commands

```bash
# ✅ Quick type check (5-10s)
npx tsc --noEmit

# ✅ Lint
npx eslint src/

# ❌ Avoid: npm run build crashes running dev server
```

---

## Testing

| Component     | Location                                | Command    |
| ------------- | --------------------------------------- | ---------- |
| Agent Logic   | `src/tests/agent-evaluation.test.ts`    | `npm test` |
| Intent Parser | `src/tests/intent-parser-test-cases.ts` | 65 tests   |

**Rules**: New feature → add test. Bug fix → add regression test.

---

## Cloudflare Deployment

```bash
npm run cf:build    # Build for Cloudflare
npm run cf:deploy   # Deploy
```

**Config**: `wrangler.toml`, `open-next.config.ts`

**API routes using `request.url` or `cookies`**: Add `export const dynamic = 'force-dynamic'`

---

## Environment Variables

```bash
# Core
GEMINI_API_KEY, TELEGRAM_BOT_TOKEN, DATABASE_URL

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL

# Payments
HITPAY_API_KEY, HITPAY_SALT

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI
```

---

## Extending AI

**Add function**: Define in `geminiService.ts` → Implement handler → Add to `tools`

**Add bot command**: Register in BotFather → Implement in `botCommandService.ts` → Update `/help`

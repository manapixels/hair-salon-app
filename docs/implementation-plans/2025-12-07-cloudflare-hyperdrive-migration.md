# Cloudflare + Hyperdrive Migration Plan (Implemented)

Migrate from Vercel + Neon to Cloudflare Pages + Hyperdrive (with Neon database) for improved latency and no cold starts.

## Status

**COMPLETE** - Migration finished on 2025-12-07.

## User Review Required

> [!NOTE]
> This plan has been fully implemented. The app now uses Drizzle ORM instead of Prisma.

> [!IMPORTANT]
> **Key Decision:** We switched from Prisma to **Drizzle ORM** because Prisma's edge adapter had compatibility issues with Cloudflare Workers. We also use `postgres.js` driver for Hyperdrive compatibility.

## Changes Implemented

### Phase 1: Install Dependencies

#### [MODIFY] [package.json](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/package.json)

Added Cloudflare and Drizzle dependencies:

- `@opennextjs/cloudflare` - OpenNext adapter for Cloudflare
- `drizzle-orm` - ORM library
- `drizzle-kit` - Migration tool
- `postgres` - PostgreSQL driver (required for Hyperdrive)
- `wrangler` (dev) - Cloudflare CLI

Removed:

- `prisma` and `@prisma/client`
- `@neondatabase/serverless` (kept as dev fallback only)

---

### Phase 2: Cloudflare Configuration

#### [NEW] [wrangler.toml](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/wrangler.toml)

Cloudflare Workers configuration with Hyperdrive binding.

#### [NEW] [open-next.config.ts](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/open-next.config.ts)

OpenNext configuration for Cloudflare.

---

### Phase 3: Drizzle ORM Setup (Replaced Prisma)

#### [NEW] [src/db/index.ts](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/src/db/index.ts)

Configured Drizzle to use `postgres.js` with Hyperdrive connection string:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// ... logic to detect Cloudflare env and use HYPERDRIVE binding
// Uses prepare: false for Hyperdrive compatibility
```

#### [NEW] [src/db/schema.ts](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/src/db/schema.ts)

Full Drizzle schema mirroring the original Prisma schema.

---

### Phase 4: Environment Variables

#### [MODIFY] [.env.example](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/.env.example)

Document required environment variables:

```bash
# Development
DATABASE_URL="postgresql://..."

# Cloudflare
# HYPERDRIVE binding injects connection string automatically
```

---

### Phase 5: Update Build Scripts

#### [MODIFY] [package.json](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/package.json)

Updated scripts for Drizzle and Cloudflare:

```json
{
  "scripts": {
    "cf:build": "npx opennextjs-cloudflare build",
    "cf:dev": "wrangler dev",
    "cf:deploy": "wrangler deploy",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

---

## Verification Plan

### Manual Testing

1. **Local Development Test**
   - Verified with `npm run dev` (uses Neon HTTP driver via `DATABASE_URL`)

2. **Cloudflare Deployment**
   - Verified with `npm run cf:deploy`
   - **Fix Applied:** Switched to `postgres.js` driver to resolve "parameterized query failed" errors with Hyperdrive.

3. **Functional Verification**
   - [x] Homepage loads
   - [x] Service categories display
   - [x] Booking flow works
   - [x] Admin dashboard accessible
   - [x] Telegram bot webhook configured for Cloudflare URL

### Rollback Plan (If needed)

The Vercel deployment remains untouched. To rollback, simply point DNS back to Vercel.

---

## Migration Steps (Completed)

1. [x] Install Drizzle & Cloudflare dependencies
2. [x] Configure `wrangler.toml` & `open-next.config.ts`
3. [x] Convert Prisma schema to Drizzle (`src/db/schema.ts`)
4. [x] Create Drizzle connection factory (`src/db/index.ts`)
5. [x] Update all app code to use `getDb()` instead of `prisma`
6. [x] Deploy to Cloudflare and verify
7. [x] Fix Hyperdrive compatibility (switch to `postgres.js`)

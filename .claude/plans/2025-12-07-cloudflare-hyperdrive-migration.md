# Cloudflare + Hyperdrive Migration Plan

Migrate from Vercel + Neon to Cloudflare Pages + Hyperdrive (with Neon database) for improved latency and no cold starts.

## User Review Required

> [!IMPORTANT]
> This is a significant infrastructure change. The app will continue to work on Vercel until you manually switch DNS/deployment.

> [!WARNING]
> **Prisma + Cloudflare requires code changes.** We need to add `@prisma/adapter-pg` and modify the Prisma client initialization.

## Background

- **Current Stack**: Vercel (free tier) + Neon (pooled connection)
- **Target Stack**: Cloudflare Pages + Hyperdrive + Neon (same database)
- **Why**: Eliminate cold starts, edge deployment in Singapore, Hyperdrive connection pooling

## Proposed Changes

### Phase 1: Install Dependencies

#### [MODIFY] [package.json](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/package.json)

Add Cloudflare and Prisma adapter dependencies:

- `@opennextjs/cloudflare` - OpenNext adapter for Cloudflare
- `@prisma/adapter-pg` - Prisma driver adapter for pg
- `pg` - PostgreSQL driver (required by adapter)
- `wrangler` (dev) - Cloudflare CLI

---

### Phase 2: Cloudflare Configuration

#### [NEW] [wrangler.toml](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/wrangler.toml)

Cloudflare Workers configuration:

```toml
name = "hair-salon-app"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[vars]
# Non-sensitive env vars

[[hyperdrive]]
binding = "HYPERDRIVE"
id = "<HYPERDRIVE_CONFIG_ID>"  # Will be created via wrangler CLI
```

#### [NEW] [open-next.config.ts](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/open-next.config.ts)

OpenNext configuration for Cloudflare:

```typescript
import type { OpenNextConfig } from '@opennextjs/cloudflare';

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: 'cloudflare-node',
      converter: 'edge',
    },
  },
};

export default config;
```

---

### Phase 3: Prisma Adapter for Hyperdrive

#### [MODIFY] [src/lib/prisma.ts](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/src/lib/prisma.ts)

Configure Prisma to use Hyperdrive connection via `@prisma/adapter-pg`:

```typescript
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// For Cloudflare Workers with Hyperdrive
function createPrismaClient(hyperdriveConnectionString?: string) {
  if (hyperdriveConnectionString) {
    // Production: Use Hyperdrive
    const pool = new Pool({ connectionString: hyperdriveConnectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  // Development: Direct connection
  return new PrismaClient({ log: ['query'] });
}

export const prisma = createPrismaClient(process.env.HYPERDRIVE_URL || undefined);
```

#### [MODIFY] [prisma/schema.prisma](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/prisma/schema.prisma)

Add `driverAdapters` preview feature:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

---

### Phase 4: Environment Variables

#### [MODIFY] [.env.example](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/.env.example) (or create if not exists)

Document required environment variables for Cloudflare:

```bash
# Existing
DATABASE_URL="postgresql://..."

# New for Cloudflare (set via wrangler secret)
# HYPERDRIVE_URL is automatically injected by Hyperdrive binding
```

---

### Phase 5: Update Build Scripts

#### [MODIFY] [package.json](file:///c:/Users/Admin/Downloads/Dev/hair-salon-app/package.json)

Add Cloudflare-specific build scripts:

```json
{
  "scripts": {
    "build:cloudflare": "npx @opennextjs/cloudflare",
    "dev:cloudflare": "wrangler dev",
    "deploy:cloudflare": "wrangler deploy",
    "hyperdrive:create": "wrangler hyperdrive create hair-salon-db --connection-string=\"$DATABASE_URL\""
  }
}
```

---

## Verification Plan

### Manual Testing (Development Stage App)

Since this is a development-stage app with minimal automated tests, verification will be manual:

1. **Local Development Test**

   ```bash
   # Step 1: Keep existing Vercel deployment running as fallback
   # Step 2: Test locally with direct Neon connection (unchanged)
   npm run dev
   # Verify booking flow works
   ```

2. **Cloudflare Preview Deployment**

   ```bash
   # Step 1: Create Hyperdrive config
   wrangler hyperdrive create hair-salon-db --connection-string="<NEON_CONNECTION_STRING>"

   # Step 2: Build for Cloudflare
   npm run build:cloudflare

   # Step 3: Deploy to preview
   wrangler deploy --env preview
   ```

3. **Functional Verification Checklist**
   - [ ] Homepage loads
   - [ ] Service categories display
   - [ ] Booking flow works (select service → stylist → date → time → confirm)
   - [ ] Login via Telegram/WhatsApp works
   - [ ] Admin dashboard accessible
   - [ ] Chat/AI booking works

4. **Performance Check**
   - Compare response times between Vercel and Cloudflare deployments
   - Check for cold start behavior (should be none on Cloudflare)

### Rollback Plan

If issues occur:

1. Keep Vercel deployment as-is (no changes to existing deployment)
2. DNS/domain remains pointed to Vercel until Cloudflare is verified
3. All Cloudflare changes are additive (new files, new scripts)

---

## Migration Steps (For User)

1. **I will**: Add dependencies and configuration files
2. **You will**: Create Cloudflare account (if needed) and run `wrangler login`
3. **You will**: Create Hyperdrive config: `npm run hyperdrive:create`
4. **You will**: Add the Hyperdrive ID to `wrangler.toml`
5. **I will/You will**: Deploy and test

---

## Risks & Mitigations

| Risk                           | Mitigation                                     |
| ------------------------------ | ---------------------------------------------- |
| Prisma adapter compatibility   | Using official `@prisma/adapter-pg`            |
| `unstable_cache` not available | OpenNext supports Next.js caching              |
| `next-intl` edge issues        | OpenNext uses Node.js compat, not Edge Runtime |
| Bundle size limits             | Monitor during build, optimize if needed       |

## Questions for You

1. Do you have a Cloudflare account ready?
2. Should I proceed with implementing Phase 1-5 above?

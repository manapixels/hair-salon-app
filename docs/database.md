# Database (Drizzle ORM)

Drizzle ORM with Neon serverless, Hyperdrive for Cloudflare, `unstable_cache` for Next.js caching.

---

## Key Files

| File                          | Purpose                                |
| ----------------------------- | -------------------------------------- |
| `src/db/schema.ts`            | Table definitions, enums, relations    |
| `src/db/index.ts`             | `getDb()` connection factory           |
| `src/lib/database.ts`         | Business logic, cached queries         |
| `src/lib/actions/services.ts` | Server Actions with cache invalidation |

---

## Usage

```typescript
import { getDb } from '@/db';
import * as schema from '@/db/schema';

const db = await getDb();
const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
```

---

## Caching

**Strategy**: `unstable_cache` with tags, on-demand revalidation via `revalidateTag()`

| Tag                                                      | Used For         |
| -------------------------------------------------------- | ---------------- |
| `services`, `service-{id}`                               | Service listings |
| `availability-{date}`, `availability-{stylistId}-{date}` | Time slots       |
| `admin-settings`                                         | Admin config     |

**Auto-revalidated**: `bookNewAppointment()`, `cancelAppointment()` call `revalidateAvailability()`

---

## Availability

- **Duration filtering**: `/api/availability?duration=90` filters slots with insufficient time
- **Processing gaps**: Services with `processingWaitTime` and `processingDuration` allow concurrent bookings during processing

---

## Critical Rules

- Always use `getDb()` from `@/db`
- Use Server Actions from `src/lib/actions/` - they handle cache invalidation
- No transactions with HTTP driver - use sequential operations

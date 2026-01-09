# Architecture & Patterns

Next.js 14 App Router patterns and application structure.

---

## Multi-Role User System

Users can have multiple roles: `ADMIN`, `STYLIST`, `CUSTOMER`

**Key Files**: `src/lib/roleHelpers.ts`, `src/db/schema.ts` (`roles` array), `src/types.ts`

```typescript
import { isAdmin, hasStylistAccess, getPrimaryRole } from '@/lib/roleHelpers';
```

| Route        | Access          | Component                             |
| ------------ | --------------- | ------------------------------------- |
| `/admin/*`   | `isAdmin(user)` | Admin dashboard (sidebar)             |
| `/dashboard` | Any logged-in   | StylistDashboard or CustomerDashboard |

---

## Page Architecture

**Pattern**: Server component page → `_components/` folder for client components

```
src/app/[locale]/admin/stylists/
├── _components/StylistManagement.tsx  ← 'use client'
└── page.tsx                            ← Server component
```

**Naming**: ❌ `*Page.tsx`, `*Client.tsx` → ✅ `*Settings.tsx`, `*Manager.tsx`

**Metadata**: `src/lib/metadata.ts` → `adminPageMetadata(locale, 'key')`

---

## Server vs Client Components

**Default**: Server Component (no directive)

**Use `'use client'` only for**: hooks, events, browser APIs, context

**Pattern**: Server page → small client wrappers for interactive parts

| Feature           | Server | Client         |
| ----------------- | ------ | -------------- |
| React hooks       | ❌     | ✅             |
| Direct DB access  | ✅     | ❌             |
| `async` component | ✅     | ❌             |
| JS bundle         | 0KB    | Adds to bundle |

---

## Admin Layout

**Single auth check** in `src/app/[locale]/admin/layout.tsx` wraps all admin pages

**Layout**: `src/components/admin/AdminLayout.tsx` (sidebar)
**Navigation**: `src/components/admin/AdminNavigation.tsx`

**Sections**: Dashboard, Appointments, Availability, Stylists, Customers, Chat, Knowledge Base, Settings (Business, Hours, Closures, Services)

---

## Error Handling

| File                               | Scope                |
| ---------------------------------- | -------------------- |
| `src/app/[locale]/error.tsx`       | Route-level          |
| `src/app/[locale]/admin/error.tsx` | Admin-specific       |
| `src/app/global-error.tsx`         | Root layout fallback |

---

## Flow Design Principles

1. **Persist state server-side** - Create pending DB records immediately
2. **Stateless recovery** - Every step recoverable with single identifier
3. **Guest support** - Use `customerEmail` for lookup

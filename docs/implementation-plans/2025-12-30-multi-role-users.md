# Multi-Role User System Implementation Plan

**Date**: 2025-12-30

## Goal

Modify the user role system to allow users to have multiple roles simultaneously (e.g., a stylist who is also an admin). **Fully remove the deprecated `role` column** since the app is still in development.

## Implementation Summary

### Database Changes

- Added `roles` text array column to `users` table (default: `['CUSTOMER']`)
- Created migration file `drizzle/0002_multi_role_users.sql` that:
  - Adds `roles` column
  - Populates from existing `role` column
  - **Drops the deprecated `role` column**

### TypeScript Type Changes

- Added `Role` type: `'CUSTOMER' | 'STYLIST' | 'ADMIN'`
- Updated `User` interface with only `roles: Role[]` (removed `role`)

### Role Helper Functions (`src/lib/roleHelpers.ts`)

- `hasRole(user, role)` - Check if user has a specific role
- `isAdmin(user)` - Check if user is an admin
- `isStylist(user)` - Check if user is a stylist
- `isCustomer(user)` - Check if user is a customer
- `hasStylistAccess(user)` - Check if user has STYLIST or ADMIN role
- `getPrimaryRole(user)` - Get highest role for display (ADMIN > STYLIST > CUSTOMER)

### Files Modified (18+)

**Database & Auth:**

- `src/lib/database.ts` - 8 locations
- `src/lib/secureSession.ts` - Uses `getPrimaryRole()` for JWT
- All auth routes (telegram, whatsapp, google)

**API Routes:**

- All appointment routes (route/cancel/edit/reschedule)
- Admin routes (customers, users/search)
- Reminders test route

**Services:**

- `geminiService.ts`, `messagingService.ts`, `messagingUserService.ts`

**UI Components:**

- `StylistDashboard.tsx`, `AppHeader.tsx`, `AccountPopup.tsx`, `BottomNavigation.tsx`
- `admin/layout.tsx`, `knowledge-base/page.tsx`, `dashboard/page.tsx`

## Verification

- TypeScript type check: **PASSED** (`npx tsc --noEmit`)

## Next Steps

1. Run the database migration
2. Test multi-role functionality manually

# Implementation Plan: Merge Subtitle into Description

**Date:** 2025-12-26

## Goal

Merge the `subtitle` and `description` fields in the services table into a single `description` field.

## Changes Made

### Schema & Types

- `src/db/schema.ts`: Removed `subtitle` column from services table
- `src/types.ts`: Removed `subtitle` from `Service` interface

### Backend

- `scripts/seed.ts`: Merged all `subtitle` values into `description` for each service
- `src/lib/database.ts`: Removed `subtitle` mapping from query results
- `src/lib/actions/services.ts`: Removed `subtitle` handling from `updateService` and `createService`

### Frontend

- `src/components/services/FindByConcernModal.tsx`: Removed `subtitle` fallback
- `src/app/[locale]/prices/page.tsx`: Removed `subtitle` fallback
- `src/components/admin/settings/salon/ServicesSettings.tsx`: Removed subtitle field from ServiceForm

## Notes

- The database column still exists but is no longer used by the application
- To fully remove from database, a migration would be needed: `ALTER TABLE services DROP COLUMN subtitle;`
- Translation files (`en.json`, `zh.json`) were reviewed - the `subtitle` keys in those files are for UI components (dashboard titles), not database fields, so no changes were needed

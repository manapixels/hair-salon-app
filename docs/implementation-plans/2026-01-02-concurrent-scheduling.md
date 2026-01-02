# Concurrent Scheduling Implementation Plan

**Date**: 2026-01-02

## Goal

Allow stylists to take on multiple clients during chemical processing "gaps" (e.g., colour developing, perm heating).

## Changes Made

### Schema (`src/db/schema.ts`)

- Added `processingWaitTime` (integer, default 0)
- Added `processingDuration` (integer, default 0)

### Types (`src/types.ts`)

- Added optional `processingWaitTime` and `processingDuration` to `Service` interface

### Seed Data (`scripts/seed.ts`)

- Added default values for 14 services (colouring, rebonding, keratin, perms)

### Admin UI (`src/components/admin/settings/salon/ServicesSettings.tsx`)

- Added "Processing Wait Time" and "Gap Duration" inputs

### Availability Logic (`src/lib/database.ts`)

- Updated `getAvailability()` and `getStylistAvailability()` to respect processing gaps

## Migration

- Generated: `0004_low_valeria_richards.sql`
- Run: `npx drizzle-kit push` to apply

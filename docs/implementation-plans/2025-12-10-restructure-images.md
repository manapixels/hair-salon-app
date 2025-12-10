# Image Directory Restructuring

**Date:** 2025-12-10
**Status:** ✅ Completed

## Overview

Restructured the `public` directory by moving all images into a centralized `public/images` folder. This improves project organization and maintainability.

## Changes Made

### Files Moved

Moved the following files/directories from `public/` to `public/images/`:

- `interior-illustration.png`
- `interior-original.jpg`
- `logo.svg`
- `may-with-customer.jpg`
- `may.jpg`
- `background-images/` (Directory)
- `colour-types/` (Directory)
- `perm-types/` (Directory)
- `rebond-types/` (Directory)

### References Updated

#### Components (`src/app` & `src/components`)

- `src/app/[locale]/page.tsx`: Updated paths for `may-with-customer.jpg` and `menu-service-bg.png`.
- `src/components/team/TeamCard.tsx`: Updated path for `may.jpg`.
- `src/components/layout/AppHeader.tsx`: Updated path for `menu-service-bg.png`.
- `src/app/[locale]/services/hair-rebonding/page.tsx`: Updated path for `hair-rebonding.jpg`.
- `src/app/[locale]/services/scalp-treatment/page.tsx`: Updated path for `scalp-treatment.png`.
- `src/app/[locale]/services/hair-perm/page.tsx`: Updated path for `hair-perm.jpg`.
- `src/app/[locale]/services/keratin-treatment/page.tsx`: Updated path for `keratin-treatment.png`.
- `src/app/[locale]/services/hair-colouring/page.tsx`: Updated path for `hair-colouring.jpg`.

#### Localization Files (`src/i18n`)

- `src/i18n/en.json`: Updated all image paths referenced in `colour-types`, `perm-types`, and `rebond-types` arrays.
- `src/i18n/zh.json`: Updated all image paths referenced in `colour-types`, `perm-types`, and `rebond-types` arrays.

## Verification

- Verified no files were left in the root `public/` directory (except for other required files if any).
- Updated all identified string references in the codebase.
- TypeScript compilation check passed (`npx tsc --noEmit`).

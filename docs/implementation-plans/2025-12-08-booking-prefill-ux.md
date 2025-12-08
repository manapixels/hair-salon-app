# Booking Pre-fill UX Improvements

**Date**: 2025-12-08

Improve the user experience when clicking "Book Now" from `FindByConcernModal` or service pages. The goal is to provide clear visual feedback that a service has been pre-selected before automatically advancing to step 2.

## UX Research Summary

Based on best practices research:

1. **Subtle "Fill-In" Animation** - Brief animation showing the selection visually filling in
2. **Highlighting/Emphasis** - Temporary glow or border color change that fades out
3. **Transient Tooltips** - Brief message like "Pre-selected for you"
4. **Typeform-style Staggered Flow** - Show the step briefly, then animate selection, then advance

## Current Behavior

The current implementation in `BookingForm.tsx` (lines 138-185):

- 500ms delay → Category selected
- 1000ms delay → Scroll to step 2

**Problem**: Selection happens silently without visual feedback. Users may not realize the app has helpfully pre-filled their selection.

---

## Proposed Changes

### Step 1: Add Pre-selection Banner Component

Create `PreSelectionBanner.tsx` - a temporary, dismissible banner above the category selector:

- "We've pre-selected [Category Name] for you based on your selection"
- Auto-dismiss after 4 seconds
- Manual dismiss with X button
- Subtle slide-in animation

### Step 2: Add Pulse Animation to CategoryCard

Add `isAnimatingSelection` prop to `CategoryCard.tsx`:

- Ring/glow effect that fades after 1 second
- Scale bounce animation (1.0 → 1.02 → 1.0)
- Respects `prefers-reduced-motion`

### Step 3: Update SimpleCategorySelector

- Accept new `isPreSelectionAnimating` prop
- Pass animation state to `CategoryCard` for the selected category
- Show `PreSelectionBanner` when pre-selection is active

### Step 4: Update BookingForm Animation Logic

Update the pre-selection animation flow:

1. **0ms**: Modal opens, show step 1 (services) with no selection
2. **600ms**: Show PreSelectionBanner with slide-in animation
3. **800ms**: Select category with pulse animation
4. **2000ms**: Scroll to step 2 (longer delay to let user see feedback)

### Step 5: Add CSS Animations

Add keyframe animations to `globals.css`:

- `pulse-selection` - glow effect
- `slide-in-from-top` - banner entrance

---

## Verification Plan

1. Manual browser testing of pre-selection flow
2. Accessibility verification with reduced motion
3. TypeScript verification: `npx tsc --noEmit`

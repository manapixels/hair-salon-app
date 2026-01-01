# Add to Calendar Feature Implementation

**Date**: 2026-01-01

## Summary

Add "Add to Calendar" functionality after booking completion, supporting Google Calendar and Apple Calendar (the two most used calendar apps).

## Changes

### New Files

- `src/lib/calendarUtils.ts` - Utility functions for generating calendar URLs and iCal files

### Modified Files

- `src/components/booking/BookingForm.tsx` - Add calendar button to confirmation UI
- `src/i18n/en.json` - Add translation keys
- `src/i18n/zh.json` - Add Chinese translations

## Technical Approach

1. **Google Calendar**: Generate URL with query parameters (text, dates, details, location)
2. **Apple Calendar/iCal**: Generate .ics file (RFC 5545 format) and trigger download

## Verification

- Manual testing of both calendar integrations after booking completion

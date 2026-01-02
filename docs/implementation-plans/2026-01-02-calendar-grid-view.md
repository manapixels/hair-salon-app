# Calendar Grid View Prototype

## Implementation Date

2026-01-02

## Goal

Add a calendar/schedule grid view for admin appointments as an experimental UI option, keeping the current list view intact.

## Changes Made

### New Files

- `src/components/admin/appointments/CalendarGridView.tsx` - Calendar grid component

### Modified Files

- `src/app/[locale]/admin/appointments/page.tsx` - Added view toggle and calendar integration
- `src/i18n/en.json` - Added listView, calendarView, noStylistsAvailable
- `src/i18n/zh.json` - Added Chinese translations

## Features

- Time axis (9 AM - 8 PM, 30-min intervals)
- Stylist columns
- Appointment blocks spanning duration
- Date navigation with Today/Previous/Next buttons
- Click appointment to edit

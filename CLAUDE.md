# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14 hair salon booking application ("Luxe Cuts") using the App Router architecture. The app features a booking system, admin dashboard, authentication, and AI-powered WhatsApp chat integration via Google's Gemini AI.

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm build

# Start production server
npm start

# Linting and formatting
npm run lint          # ESLint
npm run format        # Prettier formatting
npm run typecheck     # TypeScript type checking
npm run check         # Run all checks (lint + format + typecheck)
```

**Important**: Dependencies must be installed with `npm install --legacy-peer-deps` due to React version compatibility issues with some packages.

## Architecture & Structure

### Application Architecture

- **Framework**: Next.js 14 with App Router (src/app directory)
- **Styling**: TailwindCSS with custom design system colors
- **State Management**: React Context (AuthContext, BookingContext)
- **Database**: In-memory mock database (`src/lib/database.ts`)
- **Authentication**: Custom session-based auth with role-based access
- **AI Integration**: Google Gemini API for WhatsApp chat functionality

### Directory Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes (App Router format)
│   ├── layout.tsx      # Root layout with providers
│   └── page.tsx        # Main application page
├── components/         # React components
├── context/           # React Context providers
├── lib/               # Utilities and core logic
│   ├── database.ts    # In-memory database
│   ├── apiMock.ts     # API mocking system
│   └── apiClient.ts   # Fetch wrapper
├── services/          # External service integrations
├── styles/           # Global CSS and Tailwind
├── constants.ts      # Application constants
└── types.ts         # TypeScript type definitions
```

### Key Systems

**Authentication System**:

- Session-based authentication stored in memory (`src/lib/sessionStore.ts`)
- Default admin user: admin@luxecuts.com / admin123
- Role-based access control (admin, customer)
- Auth context provides global user state

**Booking System**:

- Service selection from predefined salon services
- Date/time slot management with availability checking
- Admin controls for blocking time slots
- Google Calendar integration for appointment scheduling

**API Mock System**:

- Development environment uses `src/lib/apiMock.ts` to intercept fetch calls
- Routes requests to mock handlers that simulate real API responses
- Enables full-stack development without backend dependencies

**Admin Dashboard**:

- Appointment management and viewing
- Time slot blocking/unblocking
- Business hours configuration
- Accessible only to admin role users

**AI Chat Integration**:

- WhatsApp Business API webhook simulation
- Google Gemini AI for intelligent chat responses
- Chat history management and context awareness

## Environment Configuration

Required environment variables in `.env.local`:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

## Important Implementation Details

**Path Aliases**:

- `@/*` maps to `./src/*` (configured in tsconfig.json)

**API Route Structure**:

- App Router format: each endpoint is a `route.ts` file in its own directory
- Dual compatibility: exports both Next.js handlers (GET/POST) and mock handlers (handleGet/handlePost)

**Mock API System**:

- The `startApiMock()` function must be called on app initialization to enable API interception
- All API routes have corresponding mock implementations for development

**Styling System**:

- TailwindCSS with custom color palette (base colors in yellow/gold theme)
- Dark mode support configured
- FontAwesome icons via CDN
- Framer Motion for animations

**Type Safety**:

- Comprehensive TypeScript types in `src/types.ts`
- Strict mode enabled with proper Next.js configuration

## Common Development Tasks

When adding new API endpoints:

1. Create directory in `src/app/api/` with `route.ts` file
2. Implement both Next.js handlers and mock handlers for development
3. Update `src/lib/apiMock.ts` to route the new endpoint
4. Ensure proper TypeScript types are defined

When modifying authentication:

- Update `src/context/AuthContext.tsx` for client-side state
- Modify `src/lib/sessionStore.ts` for session management
- Check role-based access in components and API routes

The mock database (`src/lib/database.ts`) resets on server restart - this is intentional for development.

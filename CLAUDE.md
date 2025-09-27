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
WHATSAPP_VERIFY_TOKEN=your_chosen_verify_token_here
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
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

# Feature Analysis & Current State

## 📅 **Current Features**

### **🔐 Authentication & User Management**

- **Multi-provider Authentication**
  - Email/password authentication with registration and login
  - WhatsApp OAuth integration for social login
  - Telegram authentication via widget integration
  - Session-based authentication with persistent login state
  - Role-based access control (admin/customer roles)

- **User Features**
  - User profile management with provider-specific data (Telegram ID, WhatsApp phone)
  - Auto-populated booking forms for authenticated users
  - Secure logout functionality

### **📅 Booking System**

- **Service Management**
  - 7 predefined salon services (Men's/Women's cuts, coloring, highlights, treatments)
  - Service details including price, duration, and descriptions
  - Multi-service selection and booking

- **Appointment Scheduling**
  - Interactive date/time picker with real-time availability
  - 30-minute time slot intervals
  - Automatic slot conflict detection and prevention
  - Consecutive slot booking for longer services
  - Guest booking (without authentication) with manual form entry

- **Booking Flow**
  - 3-step booking process: Service Selection → Date/Time → Confirmation
  - Dynamic booking summary with pricing calculations
  - Real-time availability checking
  - Confirmation with appointment details
  - Email notification simulation

### **🛠️ Admin Dashboard**

- **Appointment Management**
  - View daily appointment counts
  - Real-time appointment tracking

- **Availability Management**
  - Manual time slot blocking/unblocking
  - Visual time slot grid with status indicators (Available/Blocked/Booked)
  - Date-specific availability controls

- **Business Settings**
  - Operating hours configuration (opening/closing times)
  - Settings persistence and real-time updates

### **🤖 AI-Powered WhatsApp Integration**

- **Google Gemini AI Integration**
  - Natural language processing for customer inquiries
  - Function calling capabilities for booking operations
  - Context-aware responses about services and availability

- **WhatsApp Business API Support**
  - Webhook endpoint for receiving messages
  - Automated responses via Meta Graph API
  - Message verification and challenge response

- **Conversational Features**
  - Service information requests
  - Availability checking through chat
  - Appointment booking via natural language
  - Appointment cancellation support
  - Error handling and user guidance

### **🔗 External Integrations**

- **Google Calendar Integration**
  - Automatic calendar event creation for new appointments
  - Google API integration setup

- **Alternative Booking Options**
  - WhatsApp direct messaging for bookings
  - Pre-filled message templates

### **🎨 User Interface**

- **Modern Design**
  - TailwindCSS with custom color scheme
  - Dark mode support
  - Responsive design for mobile/desktop
  - FontAwesome icons throughout
  - Framer Motion animations

- **Accessibility**
  - ARIA labels and semantic HTML
  - Keyboard navigation support
  - Screen reader compatibility

## 🚫 **Current Limitations & Missing Features**

### **High Priority Missing Features**

- No real database (currently in-memory only)
- No appointment modification/rescheduling
- No comprehensive appointment management for admins
- No email confirmation system (only simulated)
- No payment processing integration
- No password reset functionality
- No customer dashboard or appointment history

### **Medium Priority Gaps**

- No staff/stylist management
- No SMS notifications or reminders
- No review/rating system
- No service management interface for admins
- No waitlist functionality
- No recurring appointments
- No customer preferences tracking

### **Technical Infrastructure Needs**

- Database migration from in-memory to persistent storage
- Error handling and logging improvements
- Testing suite (unit, integration, E2E)
- Performance monitoring and optimization
- Security hardening (rate limiting, CSRF protection)
- API documentation

## 🎯 **Recommended Development Roadmap**

### **Phase 1: Core Infrastructure (Essential)**

1. **Database Integration** - PostgreSQL/MongoDB setup with migrations
2. **Email System** - Appointment confirmations and reminders
3. **Enhanced Admin Dashboard** - Full appointment management
4. **Payment Integration** - Stripe/PayPal for deposits and payments
5. **Appointment Rescheduling** - Allow customers to modify bookings

### **Phase 2: User Experience (Important)**

6. **Customer Dashboard** - Personal appointment history and management
7. **Staff Management** - Stylist profiles and availability scheduling
8. **Enhanced Communication** - SMS notifications via Twilio
9. **Review System** - Customer feedback and ratings
10. **Mobile Responsiveness** - Improve mobile experience

### **Phase 3: Advanced Features (Nice-to-have)**

11. **Advanced Analytics** - Business intelligence and reporting
12. **Loyalty Program** - Points system and referral bonuses
13. **Multi-location Support** - Franchise/chain management
14. **Mobile App** - React Native application
15. **Advanced Integrations** - Social media, accounting software

This roadmap prioritizes essential business functionality while building toward a comprehensive salon management platform.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this hair salon booking application.

## 🏪 Project Overview

**Luxe Cuts** - A Next.js 14 hair salon booking application with admin dashboard, multi-provider authentication, and AI-powered WhatsApp/Telegram integration.

**Tech Stack**: Next.js 14 (App Router) + TypeScript + TailwindCSS + Prisma + PostgreSQL + Google Gemini AI

## ⚡ Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Development server
npm run dev

# Type checking and linting
npm run typecheck
npm run lint
npm run format
```

**Important**: Use `--legacy-peer-deps` for React version compatibility.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (/api/appointments, /api/auth, etc.)
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main application (server component)
├── components/            # React components
│   ├── AdminDashboard.tsx # Enhanced admin dashboard with filtering/sorting
│   ├── AppShell.tsx       # Main app client component
│   ├── BookingFlow.tsx    # Multi-step booking process
│   └── StylistManagement.tsx # Stylist CRUD operations
├── context/               # React Context providers
│   ├── AuthContext.tsx    # Authentication state
│   └── BookingContext.tsx # Booking and admin state
├── lib/                   # Core utilities
│   ├── database.ts        # Prisma database functions
│   ├── google.ts          # Google Calendar integration
│   └── prisma.ts          # Prisma client
├── services/              # External integrations
│   ├── geminiService.ts   # AI chat for WhatsApp/Telegram
│   └── messagingService.ts # Notification system
├── types.ts               # TypeScript definitions
└── constants.ts           # Application constants
```

## 🔐 Authentication

- **Multi-provider**: Email/password, WhatsApp OAuth, Telegram
- **Default Admin**: `admin@luxecuts.com` / `admin123`
- **Roles**: `admin` (dashboard access) | `customer` (booking only)
- **Session**: Custom session-based auth with role-based access control

## 📅 Core Features

### ✅ **Implemented (MVP Ready)**

**Booking System**:

- 7 predefined salon services with pricing
- Multi-service appointment booking
- Stylist selection (optional) with specialization filtering
- Real-time availability checking
- Guest and authenticated user booking

**Admin Dashboard**:

- Advanced appointment management with filtering, sorting, pagination
- Bulk selection and operations
- Date range filters (Today, This Week, This Month, Custom)
- Status filters (Upcoming, Past, Today)
- Enhanced search (customer, service, stylist, ID)
- Manual refresh with auto-refresh (2 minutes)

**Stylist Management**:

- CRUD operations for stylist profiles
- Service specialization assignment
- Working hours configuration
- Active/inactive status management

**Integrations**:

- Google Calendar sync (create, update, delete events)
- WhatsApp/Telegram notifications (confirmations, reschedules)
- AI-powered chat via Google Gemini (booking, rescheduling, cancellations)

## 🔧 Environment Setup

Required `.env.local` variables:

```bash
# Database
DATABASE_URL=your_neon_postgresql_url

# AI Integration
GEMINI_API_KEY=your_gemini_api_key

# WhatsApp Business API
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token

# Google Calendar (optional)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
GOOGLE_CALENDAR_TIMEZONE=America/Los_Angeles

# OAuth (optional)
WHATSAPP_CLIENT_ID=your_client_id
WHATSAPP_CLIENT_SECRET=your_client_secret
WHATSAPP_REDIRECT_URI=your_redirect_uri
```

## 💾 Database

- **Provider**: PostgreSQL (Neon hosting)
- **ORM**: Prisma
- **Schema**: `prisma/schema.prisma`
- **Functions**: `src/lib/database.ts`

**Key Models**: User, Appointment, Service, Stylist, AdminSettings

## 🤖 AI Integration

**WhatsApp/Telegram Chat**:

- Natural language appointment booking
- Availability checking
- Appointment rescheduling
- Cancellation handling
- Service information requests

**Implementation**: Google Gemini with function calling for database operations.

## 📱 Messaging System

**Automatic Notifications**:

- Appointment confirmations
- Reschedule notifications
- Cancellation alerts

**Provider Logic**:

- WhatsApp users → WhatsApp notifications
- Telegram users → Telegram notifications
- Email users → Try WhatsApp, fallback to Telegram

## 🎯 Development Guidelines

### **When Adding Features**:

1. Follow existing patterns in `src/components/`
2. Use TypeScript types from `src/types.ts`
3. Database operations go in `src/lib/database.ts`
4. API routes use App Router format (`src/app/api/*/route.ts`)

### **Code Conventions**:

- Server Components by default (no 'use client') for pages
- Client Components only when needed (interactivity, state, browser APIs)
- Comprehensive TypeScript typing
- TailwindCSS for styling with dark mode support

### **Testing Commands**:

```bash
npm run typecheck  # TypeScript validation
npm run lint       # ESLint validation
npm run format     # Prettier formatting
```

## 🚀 Deployment

**Current Setup**: Vercel + Neon PostgreSQL
**Environment**: Production-ready with proper error handling
**Scaling**: Serverless functions with database connection pooling

## 📋 Next Development Priorities

1. **Customer Dashboard** - Personal appointment history and self-service management
2. **Appointment Reminders** - Automated 24-hour notifications
3. **Enhanced Communication** - Two-way messaging between salon and customers
4. **Testing Suite** - Unit and integration tests for reliability

---

_This is an MVP-focused salon management system. Additional features can be built on this solid foundation._

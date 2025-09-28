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
- **Database**: PostgreSQL with Prisma ORM (`src/lib/database.ts`, Neon hosting)
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
│   ├── database.ts    # Database functions (Prisma)
│   ├── prisma.ts      # Prisma client configuration
│   ├── google.ts      # Google Calendar integration
│   ├── apiMock.ts     # API mocking system
│   └── apiClient.ts   # Fetch wrapper
├── services/          # External service integrations
│   ├── geminiService.ts     # Google Gemini AI integration
│   └── messagingService.ts  # WhatsApp/Telegram messaging
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

**API System**:

- Real Next.js API routes in `src/app/api/` directories
- PostgreSQL database with Prisma ORM
- No mocking - all APIs are production-ready

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
# Database
DATABASE_URL=your_neon_database_url_here

# AI Integration
GEMINI_API_KEY=your_gemini_api_key_here

# WhatsApp Integration (for notifications & chatbot)
WHATSAPP_VERIFY_TOKEN=your_chosen_verify_token_here
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token

# Google Calendar Integration
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
GOOGLE_CALENDAR_TIMEZONE=America/Los_Angeles

# OAuth Integration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token  # Also used for notifications
WHATSAPP_CLIENT_ID=your_whatsapp_client_id
WHATSAPP_CLIENT_SECRET=your_whatsapp_client_secret
WHATSAPP_REDIRECT_URI=your_whatsapp_redirect_uri
NEXTAUTH_URL=your_app_url
```

## Important Implementation Details

**Path Aliases**:

- `@/*` maps to `./src/*` (configured in tsconfig.json)

**API Route Structure**:

- App Router format: each endpoint is a `route.ts` file in its own directory
- Standard Next.js handlers (GET/POST/DELETE) with proper HTTP methods

**Real API Routes**:

- All endpoints are real Next.js API routes using App Router format
- Direct database integration with PostgreSQL via Prisma
- Production-ready with proper error handling and validation

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
2. Implement Next.js handlers (GET, POST, DELETE as needed)
3. Add proper Prisma database operations
4. Ensure proper TypeScript types and error handling

When modifying authentication:

- Update `src/context/AuthContext.tsx` for client-side state
- Modify `src/lib/sessionStore.ts` for session management
- Check role-based access in components and API routes

## Google Calendar Setup

To enable Google Calendar integration:

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google Calendar API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API" and enable it

3. **Create Service Account**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Download the JSON key file

4. **Share Calendar with Service Account**
   - Open Google Calendar, find your calendar
   - Share with the service account email (from JSON file)
   - Grant "Make changes to events" permission

5. **Configure Environment Variables**

   ```bash
   # Copy the entire JSON content as a string
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

   # Your calendar ID (found in Google Calendar settings)
   GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com

   # Your timezone
   GOOGLE_CALENDAR_TIMEZONE=America/Los_Angeles
   ```

**Note**: If Google Calendar credentials are not configured, the app will continue to work normally but appointments won't be synced to Google Calendar.

## Google Calendar Integration with Stylists

### **Current Implementation: Single Calendar**

The app currently uses **one shared Google Calendar** for all appointments across all stylists. This approach has benefits and limitations:

**✅ Benefits:**
- Simple setup - only requires one calendar configuration
- Easy for salon administrators to see all appointments in one view
- Centralized scheduling prevents double-booking across stylists
- Minimal Google API complexity

**⚠️ Limitations:**
- No stylist-specific calendar views
- Stylists can't manage their own calendars independently
- Cannot set stylist-specific availability/working hours in Google Calendar
- Limited ability to share individual stylist schedules with clients

### **Stylist Information in Calendar Events**

With the new stylist system, calendar events now include:
- **Event Title**: "Luxe Cuts Appointment: [Customer Name] ([Stylist Name])"
- **Event Description**: Includes stylist name along with services, customer info, and pricing
- **Event Details**: Services, customer contact, stylist assignment, duration, and pricing

Example calendar event:
```
Title: Luxe Cuts Appointment: John Doe (Sarah Wilson)
Description:
Services: Men's Haircut, Beard Trim
Customer: John Doe
Email: john@example.com
Stylist: Sarah Wilson
Total Price: $45
Duration: 60 minutes
```

### **Scaling Options for Multiple Stylists**

As your salon grows, you have several options for calendar management:

#### **Option 1: Keep Single Calendar (Current)**
- **Best for**: Small salons (1-3 stylists), simple management
- **Pros**: Easy setup, centralized view, prevents conflicts
- **Cons**: No individual stylist calendar management

#### **Option 2: Separate Calendar per Stylist**
- **Best for**: Medium salons (3-8 stylists), stylist autonomy
- **Implementation**: Each stylist gets their own Google Calendar
- **Environment variables needed**:
  ```bash
  # Stylist-specific calendars
  GOOGLE_CALENDAR_SARAH_ID=sarah-calendar@group.calendar.google.com
  GOOGLE_CALENDAR_MIKE_ID=mike-calendar@group.calendar.google.com
  ```
- **Pros**: Individual stylist management, specific sharing options
- **Cons**: More complex setup, requires calendar coordination

#### **Option 3: Hybrid Approach**
- **Best for**: Larger salons (8+ stylists), enterprise management
- **Implementation**: Master calendar + individual stylist calendars
- **Features**: Events created on both master and stylist-specific calendars
- **Pros**: Both centralized and individual views
- **Cons**: Most complex setup, higher API usage

#### **Option 4: Google Workspace Integration**
- **Best for**: Full salon management with Google Workspace
- **Implementation**: Resource calendars for each stylist
- **Features**: Built-in conflict detection, advanced scheduling
- **Pros**: Professional calendar management, team collaboration
- **Cons**: Requires Google Workspace subscription

### **Recommended Approach**

For most salons, we recommend:

1. **Start with Single Calendar** (current implementation)
   - Proven, simple, works well for small to medium salons
   - Easy to manage and troubleshoot

2. **Upgrade to Stylist Calendars** when you have:
   - 4+ stylists who want calendar independence
   - Client requests for stylist-specific scheduling links
   - Need for individual stylist availability management

3. **Implementation Path**:
   ```bash
   # Phase 1: Current single calendar
   GOOGLE_CALENDAR_ID=salon-main@group.calendar.google.com

   # Phase 2: Add stylist calendars (optional)
   GOOGLE_CALENDAR_MAIN_ID=salon-main@group.calendar.google.com
   GOOGLE_CALENDAR_STYLISTS_CONFIG='{"sarah":"sarah-cal@group.calendar.google.com","mike":"mike-cal@group.calendar.google.com"}'
   ```

### **Current Calendar Features**

✅ **Implemented:**
- Automatic event creation for new appointments
- Stylist information included in event details
- Event updates when appointments are modified
- Event deletion when appointments are cancelled
- Timezone support and proper scheduling
- Customer email invitations to calendar events

🔄 **Future Enhancements:**
- Stylist-specific calendar options
- Individual stylist availability sync
- Calendar-based booking integration
- Advanced recurring appointment support

## Messaging Setup (WhatsApp & Telegram)

The app automatically sends appointment confirmations via WhatsApp or Telegram based on how users authenticated:

### **WhatsApp Notifications**

- Uses Meta Graph API for WhatsApp Business
- Requires: `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN`
- Sends to users who authenticated via WhatsApp OAuth
- Fallback for users with WhatsApp phone numbers

### **Telegram Notifications**

- Uses Telegram Bot API
- Requires: `TELEGRAM_BOT_TOKEN` (same token used for login)
- Sends to users who authenticated via Telegram
- Users must have started a chat with your bot to receive messages

### **Notification Logic**

1. **WhatsApp Users**: Send via WhatsApp to their phone number
2. **Telegram Users**: Send via Telegram to their chat ID
3. **Email Users**: Try WhatsApp first, then Telegram (if available)
4. **Graceful Fallback**: App continues normally if messaging fails

**Note**: Messaging is optional - if credentials aren't configured, appointments still work but without notifications.

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
  - 4-step booking process: Service Selection → Stylist Selection → Date/Time → Confirmation
  - Smart stylist filtering based on service specializations
  - Optional stylist selection with "No Preference" option
  - Dynamic booking summary with pricing calculations and stylist info
  - Real-time availability checking
  - Confirmation with appointment details including stylist assignment
  - Email notification simulation

### **👥 Stylist Management System**

- **Stylist Profiles**
  - Complete stylist information (name, email, bio, avatar)
  - Service specialization management with checkbox selection
  - Working hours configuration for each day of the week
  - Active/inactive status control

- **Service Specializations**
  - Dynamic filtering of stylists based on selected services
  - Only shows stylists who can perform ALL requested services
  - Visual representation of stylist expertise
  - Easy management of which services each stylist offers

- **Integration Features**
  - Automatic stylist filtering in booking flow
  - Stylist information included in appointments and calendar events
  - Admin dashboard with tabbed interface for easy management
  - CRUD operations (Create, Read, Update, Delete) for all stylist data

### **🛠️ Admin Dashboard**

- **Appointment Management**
  - View daily appointment counts with stylist assignments
  - Real-time appointment tracking with stylist information
  - Tabbed interface: Appointments | Stylist Management | Availability & Settings

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
  - ✅ Automatic calendar event creation for new appointments
  - ✅ Calendar event updates for appointment changes
  - ✅ Calendar event deletion for cancelled appointments
  - ✅ Service Account authentication with Google APIs
  - ✅ Configurable timezone and calendar settings
  - ✅ Error handling with graceful fallbacks

- **Messaging & Notifications**
  - ✅ WhatsApp appointment confirmations and cancellations
  - ✅ Telegram appointment confirmations and cancellations
  - ✅ Smart provider detection based on user auth method
  - ✅ Rich formatted messages with appointment details
  - ✅ Graceful fallbacks when messaging fails
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

- ✅ Real database (PostgreSQL with Neon hosting) - **COMPLETED**
- ✅ Google Calendar integration for appointments - **COMPLETED**
- ✅ Appointment confirmations via WhatsApp/Telegram - **COMPLETED**
- No appointment modification/rescheduling
- No comprehensive appointment management for admins
- No email confirmation system (only simulated)
- No payment processing integration
- No password reset functionality
- No customer dashboard or appointment history

### **Medium Priority Gaps**

- ✅ Staff/stylist management - **COMPLETED**
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

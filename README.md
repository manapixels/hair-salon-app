# Luxe Cuts - Hair Salon Booking App

A modern Next.js 14 hair salon booking application featuring multi-provider authentication, AI-powered WhatsApp integration, and comprehensive admin management tools.

## ✨ Features

- **🔐 Multi-Provider Authentication** - Email, WhatsApp OAuth, and Telegram login
- **📅 Smart Booking System** - Real-time availability, multi-service selection, conflict prevention
- **🛠️ Admin Dashboard** - Appointment management, time slot controls, business settings
- **🤖 AI-Powered Chat** - WhatsApp integration with Google Gemini AI for natural language booking
- **📱 Modern UI** - Responsive design with dark mode, TailwindCSS, and accessibility features
- **🔗 External Integrations** - Google Calendar sync, WhatsApp Business API

## 🚀 Quick Start

### Prerequisites

- Node.js (18+ recommended)
- npm or yarn

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd hair-salon-app
   npm install --legacy-peer-deps
   ```

2. **Environment Setup:**
   Create `.env.local` and add your API keys:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   WHATSAPP_VERIFY_TOKEN=your_chosen_verify_token
   WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
   WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run typecheck    # TypeScript type checking
npm run check        # Run all checks (lint + format + typecheck)
```

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── layout.tsx      # Root layout with providers
│   └── page.tsx        # Main application page
├── components/         # React components
├── context/           # React Context providers
├── lib/               # Utilities and database
├── services/          # External service integrations
└── types.ts          # TypeScript definitions
```

## 🔑 Default Admin Access

- **Email:** admin@luxecuts.com
- **Password:** admin123

## 📖 Key Technologies

- **Framework:** Next.js 14 with App Router
- **Styling:** TailwindCSS with custom design system
- **Authentication:** Session-based with multi-provider support
- **AI Integration:** Google Gemini API
- **Database:** In-memory (development) - ready for PostgreSQL/MongoDB migration
- **TypeScript:** Strict mode with comprehensive type definitions

## 🎯 Current Development Status

This is a feature-complete MVP with:

- ✅ Full booking workflow
- ✅ Admin management tools
- ✅ AI-powered customer service
- ✅ Multi-provider authentication
- ✅ Responsive modern UI

**Next Phase:** Database migration, email system, payment integration, and enhanced admin features.

## 📚 Documentation

For detailed development information, architecture details, and feature roadmap, see [CLAUDE.md](./CLAUDE.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run check` to ensure code quality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

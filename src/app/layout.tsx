import type { Metadata } from 'next';
import { AuthProvider } from '../context/AuthContext';
import { BookingProvider } from '../context/BookingContext';
import { BookingModalProvider } from '../context/BookingModalContext';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { autoConfigureTelegramBotMenu } from '../lib/telegramBotSetup';
import { getAdminSettings } from '@/lib/database';
import { getNavigationLinks, getAllCategories } from '@/lib/categories';
import '../styles/globals.css';
import 'dotenv/config';
import { AppFooter, AppHeader } from '@/components/layout';
import { BottomNavigation } from '@/components/navigation';
import { BookingModal } from '@/components/booking';

export const metadata: Metadata = {
  title: 'Signature Trims - Salon Booking',
  description: 'Professional hair salon booking system',
  viewport: 'width=device-width, initial-scale=1.0',
};

// Auto-configure Telegram bot menu on server startup
// This runs once when the Next.js server starts
if (typeof window === 'undefined') {
  autoConfigureTelegramBotMenu().catch(error => {
    console.error('Failed to auto-configure Telegram bot menu:', error);
  });
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [adminSettings, navigationLinks, bookingCategories] = await Promise.all([
    getAdminSettings(),
    getNavigationLinks(),
    getAllCategories(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <BookingProvider>
              <BookingModalProvider bookingCategories={bookingCategories}>
                <AppHeader serviceLinks={navigationLinks} />
                <main className="min-h-screen pb-16 md:pb-0">{children}</main>
                <BottomNavigation serviceLinks={navigationLinks} />
                <AppFooter adminSettings={adminSettings} />
                <BookingModal />
              </BookingModalProvider>
            </BookingProvider>
          </AuthProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}

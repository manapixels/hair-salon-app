import type { Metadata } from 'next';
import { AuthProvider } from '../context/AuthContext';
import { BookingProvider } from '../context/BookingContext';
import { BookingModalProvider } from '../context/BookingModalContext';
import { Toaster } from 'sonner';
import { Theme } from '@radix-ui/themes';
import { autoConfigureTelegramBotMenu } from '../lib/telegramBotSetup';
import { getAdminSettings } from '@/lib/database';
import '../styles/globals.css';
import '@radix-ui/themes/styles.css';
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
  const adminSettings = await getAdminSettings();

  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
      </head>
      <body>
        <Theme accentColor="gold" grayColor="sand" radius="medium" appearance="light">
          <AuthProvider>
            <BookingProvider>
              <BookingModalProvider>
                <AppHeader />
                <main className="min-h-screen">{children}</main>
                <BottomNavigation />
                <AppFooter adminSettings={adminSettings} />
                <BookingModal />
              </BookingModalProvider>
            </BookingProvider>
          </AuthProvider>
          <Toaster position="top-right" richColors closeButton />
        </Theme>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { BookingProvider } from '@/context/BookingContext';
import { BookingModalProvider } from '@/context/BookingModalContext';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from 'sonner';
import { autoConfigureTelegramBotMenu } from '@/lib/telegramBotSetup';
import { getAdminSettings, getServiceCategories } from '@/lib/database';
import { getNavigationLinks } from '@/lib/categories';
import { publicPageMetadata } from '@/lib/metadata';
import '@/styles/globals.css';
import 'dotenv/config';
import { AppFooter, AppHeader } from '@/components/layout';
import { BottomNavigation } from '@/components/navigation';
import { BookingModal } from '@/components/booking';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return publicPageMetadata(locale, 'home');
}

// Auto-configure Telegram bot menu on server startup
// This runs once when the Next.js server starts
if (typeof window === 'undefined') {
  autoConfigureTelegramBotMenu().catch(error => {
    console.error('Failed to auto-configure Telegram bot menu:', error);
  });
}

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

// ... existing imports

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [adminSettings, navigationLinks, bookingCategories, messages] = await Promise.all([
    getAdminSettings(),
    getNavigationLinks(),
    getServiceCategories(),
    getMessages(),
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head></head>
      <body>
        <QueryProvider>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              <BookingProvider>
                <BookingModalProvider bookingCategories={bookingCategories}>
                  <AppHeader serviceLinks={navigationLinks} />
                  <main className="min-h-screen">{children}</main>
                  <AppFooter adminSettings={adminSettings} />
                  <BottomNavigation serviceLinks={navigationLinks} />
                  <BookingModal />
                </BookingModalProvider>
              </BookingProvider>
            </AuthProvider>
          </NextIntlClientProvider>
          <Toaster position="top-right" richColors closeButton />
        </QueryProvider>
      </body>
    </html>
  );
}

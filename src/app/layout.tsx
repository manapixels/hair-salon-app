import type { Metadata } from 'next';
import { AuthProvider } from '../context/AuthContext';
import { BookingProvider } from '../context/BookingContext';
import { Toaster } from 'sonner';
import { autoConfigureTelegramBotMenu } from '../lib/telegramBotSetup';
import '../styles/globals.css';
import 'dotenv/config';

export const metadata: Metadata = {
  title: 'Luxe Cuts - Salon Booking',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900">
        <AuthProvider>
          <BookingProvider>{children}</BookingProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}

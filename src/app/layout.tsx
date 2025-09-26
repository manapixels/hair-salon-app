import type { Metadata } from 'next';
import Script from 'next/script';
import { AuthProvider } from '../context/AuthContext';
import { BookingProvider } from '../context/BookingContext';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Luxe Cuts - Salon Booking',
  description: 'Professional hair salon booking system',
  viewport: 'width=device-width, initial-scale=1.0',
};

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
      </body>
    </html>
  );
}

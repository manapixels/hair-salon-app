'use client';

import { useState, useEffect } from 'react';
import BookingForm from './BookingForm';
import AdminDashboard from './AdminDashboard';
import CustomerDashboard from './CustomerDashboard';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import OAuthLoginModal from './OAuthLoginModal';
import { useAuth } from '../context/AuthContext';

type View = 'booking' | 'admin' | 'dashboard';

export default function AppShell() {
  const [view, setView] = useState<View>('booking');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Handle OAuth redirect results
    const urlParams = new URLSearchParams(window.location.search);
    const loginStatus = urlParams.get('login');
    const error = urlParams.get('error');

    if (loginStatus === 'success') {
      // Clear URL parameters and trigger auth state refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      // Force AuthContext to re-check session without full page reload
      window.dispatchEvent(new Event('auth-refresh'));
    } else if (error) {
      // Handle OAuth errors
      const errorMessages: { [key: string]: string } = {
        whatsapp_oauth_denied: 'WhatsApp login was cancelled',
        telegram_auth_failed: 'Telegram authentication failed',
        invalid_telegram_data: 'Invalid Telegram data received',
        telegram_data_expired: 'Telegram authentication data expired',
        invalid_telegram_auth: 'Telegram authentication verification failed',
        whatsapp_oauth_failed: 'WhatsApp authentication failed',
        invalid_oauth_response: 'Invalid OAuth response',
        invalid_state: 'Invalid OAuth state parameter',
      };

      const errorMessage = errorMessages[error] || 'Authentication failed';
      alert(errorMessage);

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const renderView = () => {
    switch (view) {
      case 'booking':
        return <BookingForm />;
      case 'admin':
        return user?.role === 'ADMIN' ? <AdminDashboard /> : <p>Access Denied.</p>;
      case 'dashboard':
        return user ? <CustomerDashboard /> : <p>Please sign in to access your dashboard.</p>;
      default:
        return <BookingForm />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans">
        <AppHeader view={view} onViewChange={setView} onLoginClick={() => setIsLoginOpen(true)} />
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">{renderView()}</main>
        <AppFooter />
      </div>
      <OAuthLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}

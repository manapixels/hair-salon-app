'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/queries';
import { LoadingSpinner } from '../feedback/loaders/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface StylistProfile {
  id: string;
  name: string;
  googleEmail?: string;
  googleCalendarId?: string;
}

export default function StylistDashboard() {
  const t = useTranslations('StylistDashboard');
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stylistProfile, setStylistProfile] = useState<StylistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  // Check for OAuth callback results
  useEffect(() => {
    const googleSuccess = searchParams.get('google_success');
    const googleError = searchParams.get('google_error');

    if (googleSuccess === 'connected') {
      toast.success('Google Calendar connected successfully!');
      // Clean up URL
      router.replace('/dashboard', { scroll: false });
    }

    if (googleError) {
      const errorMessages: Record<string, string> = {
        consent_denied: 'You declined to connect Google Calendar',
        missing_params: 'Invalid OAuth callback',
        invalid_state: 'Invalid session state',
        missing_tokens: 'Failed to get Google tokens',
        token_exchange_failed: 'Failed to connect to Google',
      };
      toast.error(errorMessages[googleError] || 'Failed to connect Google Calendar');
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, router]);

  // Fetch stylist profile
  useEffect(() => {
    const fetchStylistProfile = async () => {
      try {
        const response = await fetch('/api/stylists/me');
        if (response.ok) {
          const data: StylistProfile = await response.json();
          setStylistProfile(data);
        }
      } catch (error) {
        console.error('Failed to fetch stylist profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStylistProfile();
    }
  }, [user]);

  const handleConnectGoogle = () => {
    // Redirect to OAuth flow
    window.location.href = '/api/auth/google/connect';
  };

  const handleDisconnectGoogle = async () => {
    setDisconnecting(true);
    try {
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Google Calendar disconnected');
        setStylistProfile(prev =>
          prev ? { ...prev, googleEmail: undefined, googleCalendarId: undefined } : null,
        );
      } else {
        toast.error('Failed to disconnect Google Calendar');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect Google Calendar');
    } finally {
      setDisconnecting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">Please log in to view your dashboard</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" message="Loading your profile..." />
      </div>
    );
  }

  const isGoogleConnected = Boolean(stylistProfile?.googleEmail);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex items-center space-x-6">
          {user.avatar && (
            <Image
              src={user.avatar}
              alt={user.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('welcome', { name: user.name })}
            </h1>
            <p className="text-gray-600 mt-1">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('profileTitle')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('displayName')}
              </label>
              <div className="text-gray-900 font-medium text-lg">{user.name}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')}</label>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                {user.role}
              </div>
            </div>
          </div>
        </div>

        {/* Google Calendar Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('calendarTitle')}</h2>

          {isGoogleConnected ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm-8.063 14.063a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06-1.06l2.97 2.97 5.97-5.97a.75.75 0 111.06 1.06l-6.5 6.5z" />
                </svg>
                <div>
                  <div className="font-semibold text-green-800">{t('connected')}</div>
                  <div className="text-sm text-green-700">{stylistProfile?.googleEmail}</div>
                </div>
              </div>

              <p className="text-sm text-gray-600">{t('connectedDescription')}</p>

              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                onClick={handleDisconnectGoogle}
                disabled={disconnecting}
              >
                {disconnecting ? t('disconnecting') : t('disconnect')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-4.5v-9a.75.75 0 00-1.5 0v9a.75.75 0 001.5 0z" />
                  </svg>
                  <div className="font-semibold text-gray-700">{t('notConnected')}</div>
                </div>
                <p className="text-sm text-gray-600">{t('notConnectedDescription')}</p>
              </div>

              <Button className="w-full" onClick={handleConnectGoogle}>
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {t('connectGoogle')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

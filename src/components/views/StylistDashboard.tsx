'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/queries';
import { LoadingSpinner } from '../feedback/loaders/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Appointment } from '@/types';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useUpdateProfile } from '@/hooks/mutations';
import { Edit, Check, X, Spinner } from '@/lib/icons';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Badge } from '../ui/badge';
import { CheckIcon, CalendarDays } from 'lucide-react';
import { formatDisplayDate, formatTime12Hour } from '@/lib/timeUtils';

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const updateProfileMutation = useUpdateProfile();

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  const handleNameEdit = () => {
    setNewName(user?.name || '');
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    if (!newName.trim()) return;

    updateProfileMutation.mutate(
      { name: newName.trim() },
      {
        onSuccess: () => {
          setIsEditingName(false);
        },
      },
    );
  };

  const handleNameCancel = () => {
    setNewName('');
    setIsEditingName(false);
  };

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

  // Fetch stylist's appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('/api/stylists/me/appointments');
        if (response.ok) {
          const data: Appointment[] = await response.json();
          setAppointments(data);
        }
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    if (user) {
      fetchAppointments();
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

  if (!user && !loading) {
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
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="p-4">
        <div className="flex items-center space-x-6">
          {user?.avatar && (
            <Image
              src={user.avatar}
              alt={user.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20"
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('welcome', { name: user?.name || '' })}
            </h1>
            <p className="text-gray-600 mt-1">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t('profileTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t('displayName')}
                </label>
                {isEditingName ? (
                  <InputGroup className="p-3 bg-gray-50 rounded-lg border border-gray-100 h-auto">
                    <InputGroupInput
                      type="text"
                      value={newName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewName(e.target.value)
                      }
                      placeholder="Enter your display name"
                      maxLength={50}
                      className="text-gray-900 font-medium text-lg pl-0"
                    />
                    <InputGroupAddon align="inline-end" className="py-0">
                      <InputGroupButton
                        onClick={handleNameSave}
                        variant="default"
                        size="icon-sm"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <Spinner className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </InputGroupButton>
                      <InputGroupButton
                        onClick={handleNameCancel}
                        variant="outline"
                        size="icon-sm"
                        disabled={updateProfileMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-gray-900 font-medium text-lg">{user?.name}</div>
                    <Button variant="ghost" size="sm" onClick={handleNameEdit}>
                      <Edit className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t('role')}
                </label>
                <Badge variant="outline">{user?.role}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Google Calendar Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('calendarTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isGoogleConnected ? (
                <div className="bg-green-50/50 rounded-xl border border-green-100 p-6">
                  <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row mb-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 p-3 rounded-full shrink-0">
                        <CheckIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-green-900 text-md">{t('connected')}</h3>
                        <p className="text-green-800 font-medium">{stylistProfile?.googleEmail}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors w-full sm:w-auto"
                      onClick={handleDisconnectGoogle}
                      disabled={disconnecting}
                    >
                      {disconnecting ? t('disconnecting') : t('disconnect')}
                    </Button>
                  </div>

                  <div className="flex gap-3 text-green-800/80 bg-green-100/50 p-4 rounded-lg text-sm">
                    <svg
                      className="w-5 h-5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {t('connectedDescription')}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300 group">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-4.5v-9a.75.75 0 00-1.5 0v9a.75.75 0 001.5 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t('notConnected')}</h3>
                  <p className="text-gray-500 max-w-md mb-8">{t('notConnectedDescription')}</p>

                  <Button
                    className="w-full sm:w-auto min-w-[200px]"
                    size="lg"
                    onClick={handleConnectGoogle}
                  >
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointments Section */}
      <div className="mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {t('upcomingAppointments')}
            </CardTitle>
            <Badge variant="secondary">{appointments.length}</Badge>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="sm" message="Loading appointments..." />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>{t('noAppointments')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(appointment => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {formatDisplayDate(appointment.date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTime12Hour(appointment.time)} · {appointment.totalDuration} min
                        </p>
                      </div>
                      <Badge variant="outline">${appointment.totalPrice}</Badge>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-900 font-medium">{appointment.customerName}</p>
                      <p className="text-gray-500">
                        {appointment.category?.title ||
                          appointment.services.map(s => s.name).join(', ') ||
                          'Service'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

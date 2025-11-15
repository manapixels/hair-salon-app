'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import RescheduleModal from './RescheduleModal';
import { LoadingSpinner } from './loaders/LoadingSpinner';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { formatDisplayDate } from '@/lib/timeUtils';
import type { Appointment } from '@/types';
import { TextField } from './ui/TextField';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Edit, Calendar, Clock, Delete, WhatsAppIcon, TelegramIcon } from '@/lib/icons';

export default function CustomerDashboard() {
  const { user, refreshSession } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showLoader = useDelayedLoading(isLoading);
  const [error, setError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);

  // AlertDialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancelId, setAppointmentToCancelId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserAppointments();
    }
  }, [user]);

  const fetchUserAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/appointments/user');
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();

      // Validate response is an array
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      setAppointments(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameEdit = () => {
    setNewName(user?.name || '');
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!newName.trim()) return;

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (response.ok) {
        await refreshSession(); // Refresh user data
        setIsEditingName(false);
        toast.success('Display name updated successfully!');
      } else {
        throw new Error('Failed to update name');
      }
    } catch (err) {
      toast.error('Failed to update name. Please try again.');
    }
  };

  const handleNameCancel = () => {
    setNewName('');
    setIsEditingName(false);
  };

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointmentToCancelId(appointmentId);
    setCancelDialogOpen(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancelId) return;

    setCancellingId(appointmentToCancelId);
    try {
      const response = await fetch('/api/appointments/user-cancel', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId: appointmentToCancelId }),
      });

      if (response.ok) {
        // Remove the cancelled appointment from the list
        setAppointments(prev =>
          Array.isArray(prev) ? prev.filter(apt => apt.id !== appointmentToCancelId) : [],
        );
        toast.success('Appointment cancelled successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel appointment');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
      setCancelDialogOpen(false);
      setAppointmentToCancelId(null);
    }
  };

  const handleRescheduleAppointment = (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      setAppointmentToReschedule(appointment);
      setRescheduleModalOpen(true);
    }
  };

  const handleRescheduleSuccess = () => {
    // Refresh appointments list after successful reschedule
    fetchUserAppointments();
  };

  const handleRescheduleClose = () => {
    setRescheduleModalOpen(false);
    setAppointmentToReschedule(null);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 dark:text-gray-400">
          Please sign in to view your dashboard
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex items-center space-x-6">
          {user.avatar && (
            <Image
              src={user.avatar}
              alt={user.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-accent/20"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Here you can manage your appointments and profile settings.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Profile</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                {isEditingName ? (
                  <div className="space-y-2">
                    <TextField
                      type="text"
                      value={newName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewName(e.target.value)
                      }
                      placeholder="Enter your display name"
                      maxLength={50}
                    />
                    <div className="flex space-x-2">
                      <Button variant="solid" size="sm" onClick={handleNameSave}>
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleNameCancel}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-gray-900 dark:text-white font-medium text-lg">
                      {user.name}
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleNameEdit}>
                      <Edit className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Connected Account
                </label>
                <div className="flex items-center space-x-2">
                  {user.authProvider === 'whatsapp' && (
                    <>
                      <WhatsAppIcon className="h-5 w-5 text-green-600" />
                      <span className="text-gray-900 dark:text-white font-medium">WhatsApp</span>
                      {user.whatsappPhone && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({user.whatsappPhone})
                        </span>
                      )}
                    </>
                  )}
                  {user.authProvider === 'telegram' && (
                    <>
                      <TelegramIcon className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-900 dark:text-white font-medium">Telegram</span>
                      {user.telegramId && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          (ID: {user.telegramId})
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Preferences
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  You will receive appointment updates via{' '}
                  <span className="font-semibold">
                    {user.authProvider === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Your Appointments
            </h2>

            {showLoader ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <LoadingSpinner size="lg" message="Loading your appointments..." />
              </div>
            ) : error ? (
              <ErrorState
                title="Failed to Load Appointments"
                message={error}
                onRetry={fetchUserAppointments}
              />
            ) : appointments.length === 0 ? (
              <EmptyState
                icon={
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                }
                title="No appointments found"
                description="Ready for a new look? Book your first appointment to get started!"
              />
            ) : (
              <div className="space-y-6">
                {appointments.map(appointment => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="font-bold text-gray-900 dark:text-white text-lg">
                            {formatDisplayDate(appointment.date)}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400 font-semibold">
                            at {appointment.time}
                          </span>
                        </div>

                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Services:{' '}
                          </span>
                          <span className="text-gray-800 dark:text-white font-semibold">
                            {Array.isArray(appointment.services)
                              ? appointment.services.map((s: any) => s.name).join(', ')
                              : 'Services not available'}
                          </span>
                        </div>

                        {appointment.stylistId && (
                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Stylist:{' '}
                            </span>
                            <span className="text-gray-800 dark:text-white font-semibold">
                              {appointment.stylist?.name || 'Assigned stylist'}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center space-x-6 text-sm">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">
                            {appointment.totalDuration} min
                          </span>
                          <span className="text-gray-600 dark:text-gray-400 font-bold">
                            ${appointment.totalPrice}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRescheduleAppointment(appointment.id)}
                          loading={reschedulingId === appointment.id}
                          disabled={reschedulingId === appointment.id}
                        >
                          <Calendar className="h-4 w-4" aria-hidden="true" />
                          Reschedule
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          loading={cancellingId === appointment.id}
                          disabled={cancellingId === appointment.id}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          <Delete className="h-4 w-4" aria-hidden="true" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {appointmentToReschedule && (
        <RescheduleModal
          appointment={appointmentToReschedule}
          isOpen={rescheduleModalOpen}
          onClose={handleRescheduleClose}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {/* Cancel Appointment Dialog */}
      <AlertDialog.Root open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <AlertDialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
            <AlertDialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Cancel Appointment
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to cancel this appointment?
            </AlertDialog.Description>
            <div className="flex gap-3 justify-end">
              <AlertDialog.Cancel asChild>
                <Button variant="soft" size="sm">
                  No, keep it
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button variant="danger" size="sm" onClick={confirmCancelAppointment}>
                  Yes, cancel it
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}

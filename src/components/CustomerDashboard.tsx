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
import { Button } from '@radix-ui/themes';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

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
                      <Button
                        onClick={handleNameSave}
                        className="text-sm bg-accent px-4 py-2 rounded-lg font-semibold"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={handleNameCancel}
                        variant="outline"
                        className="text-sm px-4 py-2 rounded-lg font-semibold"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-gray-900 dark:text-white font-medium text-lg">
                      {user.name}
                    </div>
                    <button
                      onClick={handleNameEdit}
                      className="text-sm text-accent hover:text-accent dark:text-accent font-semibold"
                    >
                      Edit
                    </button>
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
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
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
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.88l-1.44 6.92c-.12.56-.44.7-.9.44l-2.2-1.6-1.04.98c-.12.12-.22.22-.4.22l.16-2.28 4.24-3.8c.18-.16-.04-.24-.28-.08l-5.24 3.32-2.16-.68c-.56-.18-.58-.54.1-.8l8.4-3.26c.48-.18.9.12.74.74z" />
                      </svg>
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
                        <button
                          onClick={() => handleRescheduleAppointment(appointment.id)}
                          disabled={reschedulingId === appointment.id}
                          className="text-accent hover:text-accent dark:text-accent text-sm disabled:opacity-50 inline-flex items-center gap-1 font-semibold"
                        >
                          {reschedulingId === appointment.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            'Reschedule'
                          )}
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={cancellingId === appointment.id}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 text-sm disabled:opacity-50 inline-flex items-center gap-1 font-semibold"
                        >
                          {cancellingId === appointment.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            'Cancel'
                          )}
                        </button>
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
                <button className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  No, keep it
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={confirmCancelAppointment}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, cancel it
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}

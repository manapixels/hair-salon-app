'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import RescheduleModal from './RescheduleModal';
import type { Appointment } from '@/types';

export default function CustomerDashboard() {
  const { user, refreshSession } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserAppointments();
    }
  }, [user]);

  const fetchUserAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/appointments/user');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        throw new Error('Failed to fetch appointments');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
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

  const handleCancelAppointment = async (appointmentId: string) => {
    toast.custom(
      (t: string | number) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-3">
            <p className="font-medium text-gray-900 dark:text-white">
              Are you sure you want to cancel this appointment?
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  toast.dismiss(t);
                  setCancellingId(appointmentId);
                  try {
                    const response = await fetch('/api/appointments/user-cancel', {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ appointmentId }),
                    });

                    if (response.ok) {
                      // Remove the cancelled appointment from the list
                      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
                      toast.success('Appointment cancelled successfully');
                    } else {
                      const errorData = await response.json();
                      throw new Error(errorData.error || 'Failed to cancel appointment');
                    }
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : 'Failed to cancel appointment',
                    );
                  } finally {
                    setCancellingId(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Yes, cancel it
              </button>
              <button
                onClick={() => toast.dismiss(t)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                No, keep it
              </button>
            </div>
          </div>
        </div>
      ),
      {
        duration: Infinity,
      },
    );
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
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4">
          {user.avatar && (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your appointments and profile</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i className="fa-solid fa-user mr-2"></i>
              Your Profile
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                {isEditingName ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your display name"
                      maxLength={50}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleNameSave}
                        className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleNameCancel}
                        className="text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-gray-900 dark:text-white font-medium">{user.name}</div>
                    <button
                      onClick={handleNameEdit}
                      className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 mt-1"
                    >
                      <i className="fa-solid fa-edit mr-1"></i>
                      Edit name
                    </button>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Connected Account
                </label>
                <div className="flex items-center space-x-2">
                  {user.authProvider === 'whatsapp' && (
                    <>
                      <i className="fa-brands fa-whatsapp text-green-600"></i>
                      <span className="text-gray-900 dark:text-white">WhatsApp</span>
                      {user.whatsappPhone && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({user.whatsappPhone})
                        </span>
                      )}
                    </>
                  )}
                  {user.authProvider === 'telegram' && (
                    <>
                      <i className="fa-brands fa-telegram text-blue-600"></i>
                      <span className="text-gray-900 dark:text-white">Telegram</span>
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
                  Appointment confirmations via{' '}
                  {user.authProvider === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <i className="fa-solid fa-calendar-check mr-2"></i>
              Your Appointments
            </h2>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-600 dark:text-gray-400">Loading appointments...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 dark:text-red-400">{error}</div>
                <button
                  onClick={fetchUserAppointments}
                  className="mt-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Try again
                </button>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-600 dark:text-gray-400 mb-4">No appointments found</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Book your first appointment to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map(appointment => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <i className="fa-solid fa-calendar text-indigo-600"></i>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(appointment.date).toLocaleDateString()}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            at {appointment.time}
                          </span>
                        </div>

                        <div className="mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Services:{' '}
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {Array.isArray(appointment.services)
                              ? appointment.services.map((s: any) => s.name).join(', ')
                              : 'Services not available'}
                          </span>
                        </div>

                        {appointment.stylistId && (
                          <div className="mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Stylist:{' '}
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {appointment.stylist?.name || 'Assigned stylist'}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            <i className="fa-solid fa-clock mr-1"></i>
                            {appointment.totalDuration} min
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            <i className="fa-solid fa-dollar-sign mr-1"></i>$
                            {appointment.totalPrice}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRescheduleAppointment(appointment.id)}
                          disabled={reschedulingId === appointment.id}
                          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 text-sm disabled:opacity-50"
                        >
                          <i className="fa-solid fa-edit mr-1"></i>
                          {reschedulingId === appointment.id ? 'Rescheduling...' : 'Reschedule'}
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={cancellingId === appointment.id}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 text-sm disabled:opacity-50"
                        >
                          <i className="fa-solid fa-times mr-1"></i>
                          {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel'}
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
    </div>
  );
}

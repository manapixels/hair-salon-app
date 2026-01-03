'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth, useUserAppointments, useUserPattern } from '@/hooks/queries';
import { useCancelAppointment, useUpdateProfile } from '@/hooks/mutations';
import EditAppointmentModal from '../booking/EditAppointmentModal';
import { LoadingSpinner } from '../feedback/loaders/LoadingSpinner';
import { ErrorState } from '../feedback/ErrorState';
import { EmptyState } from '../feedback/EmptyState';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import type { Appointment } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CancelAppointmentDialog } from '@/components/booking/shared';
import { Edit, Delete, WhatsAppIcon, TelegramIcon } from '@/lib/icons';
import { Spinner } from '../ui/spinner';
import AppointmentCard from '@/components/appointments/AppointmentCard';
import { useTranslations } from 'next-intl';

export default function CustomerDashboard() {
  const t = useTranslations('CustomerDashboard');
  const { user } = useAuth();

  // Use React Query hooks
  const { data: appointments = [], isLoading, error, refetch } = useUserAppointments();
  const { data: userPattern } = useUserPattern();
  const cancelAppointmentMutation = useCancelAppointment();
  const updateProfileMutation = useUpdateProfile();

  const showLoader = useDelayedLoading(isLoading);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);

  // AlertDialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancelId, setAppointmentToCancelId] = useState<string | null>(null);

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

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointmentToCancelId(appointmentId);
    setCancelDialogOpen(true);
  };

  const confirmCancelAppointment = () => {
    if (!appointmentToCancelId) return;

    cancelAppointmentMutation.mutate(
      { appointmentId: appointmentToCancelId },
      {
        onSettled: () => {
          setCancelDialogOpen(false);
          setAppointmentToCancelId(null);
        },
      },
    );
  };

  const handleEditAppointment = (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      setAppointmentToEdit(appointment);
      setEditModalOpen(true);
    }
  };

  const handleSaveAppointment = async (updatedData: Partial<Appointment>) => {
    if (!appointmentToEdit) return;

    const response = await fetch('/api/appointments/edit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: appointmentToEdit.id,
        ...updatedData,
      }),
    });

    if (!response.ok) {
      const error = (await response.json()) as any;
      throw new Error(error.message || 'Failed to update appointment');
    }

    await refetch();
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setAppointmentToEdit(null);
  };

  if (!user && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">{t('pleaseLogIn')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex items-center space-x-6">
          {user?.avatar && (
            <Image
              src={user?.avatar}
              alt={user?.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('welcome', { name: user?.name || '' })}
            </h1>
            <p className="text-gray-600 mt-1">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t('yourProfile')}</h2>

            {/* User Pattern / "The Usual" */}
            <div className="mb-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">
                {t('yourUsual')}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('favoriteService')}</span>
                  <span className="font-medium text-gray-900">
                    {userPattern?.favoriteService || t('notEnoughData')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('favoriteStylist')}</span>
                  <span className="font-medium text-gray-900">
                    {userPattern?.favoriteStylistId || t('notEnoughData')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('typicalTime')}</span>
                  <span className="font-medium text-gray-900">
                    {userPattern?.typicalTime || t('notEnoughData')}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 italic">{t('usualTip')}</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('displayName')}
                </label>
                {isEditingName ? (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={newName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewName(e.target.value)
                      }
                      placeholder={t('enterDisplayName')}
                      maxLength={50}
                    />
                    <div className="flex space-x-2">
                      <Button variant="default" size="sm" onClick={handleNameSave}>
                        {t('save')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleNameCancel}>
                        {t('cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-gray-900 font-medium text-lg">{user?.name}</div>
                    <Button variant="ghost" size="sm" onClick={handleNameEdit}>
                      <Edit className="h-4 w-4" aria-hidden="true" />
                      {t('edit')}
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('connectedAccount')}
                </label>
                <div className="flex items-center space-x-2">
                  {user?.authProvider === 'whatsapp' && (
                    <>
                      <WhatsAppIcon className="h-5 w-5 text-green-600" />
                      <span className="text-gray-900 font-medium">{t('whatsapp')}</span>
                      {user?.whatsappPhone && (
                        <span className="text-sm text-gray-600">({user?.whatsappPhone})</span>
                      )}
                    </>
                  )}
                  {user?.authProvider === 'telegram' && (
                    <>
                      <TelegramIcon className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-900 font-medium">{t('telegram')}</span>
                      {user?.telegramId && (
                        <span className="text-sm text-gray-600">(ID: {user?.telegramId})</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('contactPreferences')}
                </label>
                <div className="text-sm text-gray-600">
                  {t('contactPreferencesDesc')}{' '}
                  <span className="font-semibold">
                    {user?.authProvider === 'whatsapp' ? t('whatsapp') : t('telegram')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t('yourAppointments')}</h2>

            {showLoader ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <LoadingSpinner size="lg" message={t('loadingAppointments')} />
              </div>
            ) : error ? (
              <ErrorState
                title={t('failedToLoad')}
                message={error instanceof Error ? error.message : t('unableToLoad')}
                onRetry={() => refetch()}
              />
            ) : appointments.length === 0 ? (
              <EmptyState
                icon={
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
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
                title={t('noAppointmentsTitle')}
                description={t('noAppointmentsDesc')}
              />
            ) : (
              <div className="space-y-6">
                {appointments.map(appointment => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    showSource={false}
                    showStylist={true}
                    hideCustomer={true}
                    className="hover:shadow-md border-gray-200"
                    actions={
                      <div className="flex flex-col space-y-2 items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAppointment(appointment.id)}
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                          {t('edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={cancelAppointmentMutation.isPending}
                          className="text-red-600 hover:text-red-800"
                        >
                          {cancelAppointmentMutation.isPending ? (
                            <Spinner className="mr-2" />
                          ) : (
                            <Delete className="h-4 w-4" aria-hidden="true" />
                          )}
                          {t('cancel')}
                        </Button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Appointment Modal */}
      <EditAppointmentModal
        isOpen={editModalOpen}
        onClose={handleEditClose}
        appointment={appointmentToEdit}
        onSave={handleSaveAppointment}
      />

      {/* Cancel Appointment Dialog */}
      <CancelAppointmentDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={confirmCancelAppointment}
        isLoading={cancelAppointmentMutation.isPending}
      />
    </div>
  );
}

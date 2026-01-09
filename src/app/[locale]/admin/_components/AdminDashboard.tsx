'use client';

import { useState, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import {
  Calendar,
  TrendingUp,
  Clock,
  DollarSign,
  ChevronRight,
  MessageSquare,
  MoreVertical,
  Edit,
  X,
} from 'lucide-react';
import type { Appointment } from '@/types';
import AppointmentCard from '@/components/appointments/AppointmentCard';
import EditAppointmentModal from '@/components/booking/EditAppointmentModal';
import { CancelAppointmentDialog } from '@/components/booking/shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminDashboardProps {
  appointments: Appointment[];
  flaggedChatCount?: number;
  onAppointmentsChange?: () => void;
}

export default function AdminDashboard({
  appointments,
  flaggedChatCount = 0,
  onAppointmentsChange,
}: AdminDashboardProps) {
  const t = useTranslations('Admin.Dashboard');
  const basePath = '/admin';

  // State for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);

  // State for cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancelId, setAppointmentToCancelId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const appointmentsList = Array.isArray(appointments) ? appointments : [];

    const todayAppts = appointmentsList.filter(
      a => new Date(a.date) >= startOfToday && new Date(a.date) <= endOfToday,
    );

    const upcomingAppts = appointmentsList.filter(a => new Date(a.date) > endOfToday);

    return {
      today: todayAppts.length,

      upcoming: upcomingAppts.length,

      todayAppointments: todayAppts.slice(0, 5), // First 5 for preview
    };
  }, [appointments]);

  const handleEditAppointment = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setEditModalOpen(true);
  };

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointmentToCancelId(appointmentId);
    setCancelDialogOpen(true);
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
      const error = (await response.json()) as { message?: string };
      throw new Error(error.message || 'Failed to update appointment');
    }

    onAppointmentsChange?.();
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancelId) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentToCancelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      onAppointmentsChange?.();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setAppointmentToCancelId(null);
    }
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setAppointmentToEdit(null);
  };

  return (
    <>
      <div className="space-y-6">
        {/* KPI Cards */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard
              title={t('today')}
              value={kpis.today}
              subtitle={t('appointments')}
              href={`${basePath}/appointments?filter=today`}
            />

            <KPICard
              title={t('upcoming')}
              value={kpis.upcoming}
              subtitle={t('futureBookings')}
              href={`${basePath}/appointments`}
            />
          </div>
        </section>

        {/* Flagged Chats Alert */}
        {flaggedChatCount > 0 && (
          <Link
            href={`${basePath}/chat`}
            className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <MessageSquare className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-900">
                  {t('flaggedConversations', { count: flaggedChatCount })}
                </p>
                <p className="text-sm text-red-700">{t('requiresAttention')}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400" />
          </Link>
        )}

        {/* Today's Appointments Preview */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t('todaysAppointments')}</h2>
            <Link
              href={`${basePath}/appointments`}
              className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              {t('viewAll')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {kpis.todayAppointments.length === 0 ? (
            <div className="bg-white border border-border rounded-lg p-8 text-center">
              <Calendar className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t('noAppointmentsToday')}</p>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-lg divide-y divide-border">
              {kpis.todayAppointments.map(appointment => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  showSource={true}
                  showStylist={true}
                  actions={
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">{t('openMenu')}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditAppointment(appointment)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <X className="mr-2 h-4 w-4" />
                          {t('cancel')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">{t('quickActions')}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3">
            <QuickActionCard
              href={`${basePath}/stylists`}
              title={t('manageStylists')}
              description={t('manageStylistsDescription')}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <QuickActionCard
              href={`${basePath}/settings/services`}
              title={t('updatePrices')}
              description={t('servicesPricing')}
              icon={<DollarSign className="w-5 h-5" />}
            />
            <QuickActionCard
              href={`${basePath}/settings/closures`}
              title={t('addClosure')}
              description={t('holidaysClosures')}
              icon={<Calendar className="w-5 h-5" />}
            />
          </div>
        </section>
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
        isLoading={isCancelling}
      />
    </>
  );
}

// --- Sub-components ---

function KPICard({
  title,
  value,
  subtitle,
  href,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {href && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </div>
      <p className="text-2xl lg:text-3xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="bg-white p-4 lg:p-5 border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all block"
      >
        {content}
      </Link>
    );
  }

  return <div className="bg-white p-4 lg:p-5 border border-border rounded-lg">{content}</div>;
}

function QuickActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center p-4 bg-white border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all text-center"
    >
      <div className="p-2 bg-muted rounded-lg mb-2 text-muted-foreground">{icon}</div>
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}

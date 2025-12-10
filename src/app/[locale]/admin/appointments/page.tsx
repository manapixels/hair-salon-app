'use client';

import { useEffect, useState, useMemo } from 'react';
import { useBooking } from '@/context/BookingContext';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import EditAppointmentModal from '@/components/booking/EditAppointmentModal';
import type { Appointment } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Refresh } from '@/lib/icons';
import { CircleUserRound, Earth, User, MoreHorizontal } from 'lucide-react';
import TelegramIcon from '@/components/icons/telegram';
import AppointmentCard from '@/components/appointments/AppointmentCard';
import { useTranslations, useFormatter } from 'next-intl';
import { formatShortDate } from '@/lib/timeUtils';

export default function AppointmentsPage() {
  const { appointments, fetchAndSetAppointments } = useBooking();
  const t = useTranslations('Admin.Appointments');
  const format = useFormatter();

  // i18n date/time formatting helpers
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format.dateTime(dateObj, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format.dateTime(date, { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past' | 'today'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setAppointmentsLoading(true);
      await fetchAndSetAppointments();
      setAppointmentsLoading(false);
    };
    loadData();
  }, [fetchAndSetAppointments]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return (Array.isArray(appointments) ? appointments : []).filter(appointment => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          appointment.customerName.toLowerCase().includes(term) ||
          appointment.customerEmail.toLowerCase().includes(term) ||
          appointment.services.some(s => s.name.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
      );

      if (dateFilter === 'today') {
        const aptDate = new Date(appointment.date);
        if (aptDate < startOfToday || aptDate > endOfToday) return false;
      } else if (dateFilter === 'week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59);
        const aptDate = new Date(appointment.date);
        if (aptDate < startOfWeek || aptDate > endOfWeek) return false;
      } else if (dateFilter === 'month') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        const aptDate = new Date(appointment.date);
        if (aptDate < startOfMonth || aptDate > endOfMonth) return false;
      }

      if (statusFilter === 'today') {
        const aptDate = new Date(appointment.date);
        if (aptDate < startOfToday || aptDate > endOfToday) return false;
      } else if (statusFilter === 'upcoming') {
        if (new Date(appointment.date) <= endOfToday) return false;
      } else if (statusFilter === 'past') {
        if (new Date(appointment.date) >= startOfToday) return false;
      }

      return true;
    });
  }, [appointments, searchTerm, dateFilter, statusFilter]);

  // Sorted appointments
  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [filteredAppointments]);

  // Pagination
  const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = sortedAppointments.slice(startIndex, startIndex + itemsPerPage);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAndSetAppointments();
    setIsRefreshing(false);
    toast.success(t('refreshed'));
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditModalOpen(true);
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
    setCancelDialogOpen(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return;
    const toastId = toast.loading(t('cancelling'));
    try {
      const response = await fetch('/api/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: appointmentToCancel.customerEmail,
          date: appointmentToCancel.date.toISOString().split('T')[0],
          time: appointmentToCancel.time,
        }),
      });
      if (!response.ok) throw new Error('Failed to cancel');
      await fetchAndSetAppointments();
      toast.success(t('cancelled'), { id: toastId });
    } catch {
      toast.error(t('cancelFailed'), { id: toastId });
    } finally {
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
    }
  };

  const handleSaveAppointment = async (updatedData: Partial<Appointment>) => {
    if (!selectedAppointment) return;
    const response = await fetch('/api/appointments/edit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedAppointment.id, ...updatedData }),
    });
    if (!response.ok) {
      const errorData = (await response.json()) as { message?: string };
      throw new Error(errorData.message || 'Failed to update');
    }
    await fetchAndSetAppointments();
    setEditModalOpen(false);
    setSelectedAppointment(null);
  };

  if (appointmentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" message={t('loading')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {t('showing', {
              start: startIndex + 1,
              end: Math.min(startIndex + itemsPerPage, sortedAppointments.length),
              total: sortedAppointments.length,
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <Refresh className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border border-border rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <Select value={dateFilter} onValueChange={v => setDateFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder={t('datePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allDates')}</SelectItem>
              <SelectItem value="today">{t('today')}</SelectItem>
              <SelectItem value="week">{t('thisWeek')}</SelectItem>
              <SelectItem value="month">{t('thisMonth')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder={t('statusPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="today">{t('today')}</SelectItem>
              <SelectItem value="upcoming">{t('upcoming')}</SelectItem>
              <SelectItem value="past">{t('past')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Appointments List */}
      {appointmentsLoading ? (
        <div className="p-8 text-center">
          <LoadingSpinner size="md" message={t('loading')} />
        </div>
      ) : paginatedAppointments.length === 0 ? (
        <div className="bg-white border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">{t('noAppointmentsFound')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group appointments by date */}
          {Object.entries(
            paginatedAppointments.reduce(
              (groups, appointment) => {
                const dateKey = new Date(appointment.date).toDateString();
                if (!groups[dateKey]) {
                  groups[dateKey] = [];
                }
                groups[dateKey].push(appointment);
                return groups;
              },
              {} as Record<string, Appointment[]>,
            ),
          )
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([dateKey, dateAppointments]) => (
              <div key={dateKey}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  {formatShortDate(new Date(dateKey))}
                </h3>
                <div className="bg-white border border-border rounded-lg divide-y divide-border">
                  {dateAppointments.map(appointment => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      showSource={true}
                      showStylist={true}
                      actions={
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditAppointment(appointment)}>
                              {t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCancelAppointment(appointment)}
                              className="text-destructive focus:text-destructive"
                            >
                              {t('cancel')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('pageIndicator', { current: currentPage, total: totalPages })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              {t('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <EditAppointmentModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSave={handleSaveAppointment}
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cancelDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cancelDialogDesc', { name: appointmentToCancel?.customerName ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('no')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelAppointment}>
              {t('yesCancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

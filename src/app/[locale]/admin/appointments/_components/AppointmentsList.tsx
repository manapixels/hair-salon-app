'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useBooking } from '@/context/BookingContext';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import EditAppointmentModal from '@/components/booking/EditAppointmentModal';
import type { Appointment, Stylist } from '@/types';
import CalendarGridView from '@/components/appointments/CalendarGridView';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
import { MoreHorizontal, SlidersHorizontal, List, CalendarDays } from 'lucide-react';
import AppointmentCard from '@/components/appointments/AppointmentCard';
import { useTranslations, useFormatter } from 'next-intl';
import { formatShortDate } from '@/lib/timeUtils';

export default function AppointmentsList() {
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
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const lastFetchTime = useRef<number>(0);

  // Calendar view state
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Throttled refresh - won't refetch if data was fetched within last 30 seconds
  const REFRESH_THROTTLE_MS = 30000;

  const refreshAppointments = useCallback(
    async (showLoadingState = false) => {
      const now = Date.now();
      if (now - lastFetchTime.current < REFRESH_THROTTLE_MS) {
        return; // Skip if recently fetched
      }

      if (showLoadingState) {
        setIsRefreshing(true);
      }
      await fetchAndSetAppointments();
      lastFetchTime.current = Date.now();
      if (showLoadingState) {
        setIsRefreshing(false);
      }
    },
    [fetchAndSetAppointments],
  );

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setAppointmentsLoading(true);
      await fetchAndSetAppointments();
      lastFetchTime.current = Date.now();
      setAppointmentsLoading(false);
    };
    loadData();

    // Fetch stylists for calendar view
    const fetchStylists = async () => {
      try {
        const res = await fetch('/api/stylists');
        if (res.ok) {
          const data = (await res.json()) as { stylists?: Stylist[] };
          setStylists(data.stylists || []);
        }
      } catch (error) {
        console.error('Failed to fetch stylists:', error);
      }
    };
    fetchStylists();
  }, [fetchAndSetAppointments]);

  // Auto-refresh on window focus/visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAppointments();
      }
    };

    const handleFocus = () => {
      refreshAppointments();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshAppointments]);

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

      // Filter by active tab (upcoming vs past)
      if (activeTab === 'upcoming') {
        // Include today and future appointments
        if (new Date(appointment.date) < startOfToday) return false;
      } else if (activeTab === 'past') {
        // Only past appointments (before today)
        if (new Date(appointment.date) >= startOfToday) return false;
      }

      return true;
    });
  }, [appointments, searchTerm, dateFilter, activeTab]);

  // Sorted appointments - upcoming: chronological, past: reverse chronological
  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      // For past appointments, show most recent first
      if (activeTab === 'past') {
        return dateB - dateA;
      }
      // For upcoming, show soonest first
      return dateA - dateB;
    });
  }, [filteredAppointments, activeTab]);

  // Count appointments by tab (independent of active tab, but respecting search/date filters)
  const { upcomingCount, pastCount } = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Apply search and date filters only (not tab filter)
    const baseFiltered = (Array.isArray(appointments) ? appointments : []).filter(appointment => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          appointment.customerName.toLowerCase().includes(term) ||
          appointment.customerEmail.toLowerCase().includes(term) ||
          appointment.services.some(s => s.name.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      if (dateFilter === 'today') {
        const aptDate = new Date(appointment.date);
        const endOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59,
        );
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

      return true;
    });

    let upcoming = 0;
    let past = 0;
    baseFiltered.forEach(apt => {
      if (new Date(apt.date) >= startOfToday) {
        upcoming++;
      } else {
        past++;
      }
    });

    return { upcomingCount: upcoming, pastCount: past };
  }, [appointments, searchTerm, dateFilter]);

  // Pagination
  const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = sortedAppointments.slice(startIndex, startIndex + itemsPerPage);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAndSetAppointments();
    lastFetchTime.current = Date.now();
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
      if (!response.ok) throw new Error(t('cancelFailed'));
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
      throw new Error(errorData.message || t('failedToUpdate'));
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
      {/* Tabs for Upcoming/Past */}
      <Tabs
        value={activeTab}
        onValueChange={v => {
          setActiveTab(v as 'upcoming' | 'past');
          setCurrentPage(1);
        }}
      >
        <div className="flex flex-wrap justify-between items-center gap-4">
          <TabsList className="w-auto">
            <TabsTrigger value="upcoming">
              {t('upcoming')}
              <span className="ml-1.5 text-xs text-muted-foreground">{upcomingCount}</span>
            </TabsTrigger>
            <TabsTrigger value="past">
              {t('past')}
              <span className="ml-1.5 text-xs text-muted-foreground">{pastCount}</span>
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex border border-border rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none px-3"
              >
                <List className="w-4 h-4 mr-1" />
                {t('listView')}
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="rounded-none px-3"
              >
                <CalendarDays className="w-4 h-4 mr-1" />
                {t('calendarView')}
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <Refresh className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 my-4">
          {/* Search - always visible */}
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-white"
            />
          </div>

          {/* Mobile: Filter dropdown */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  {dateFilter !== 'all' && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{t('datePlaceholder')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={dateFilter}
                  onValueChange={v => setDateFilter(v as 'all' | 'today' | 'week' | 'month')}
                >
                  <DropdownMenuRadioItem value="all">{t('allDates')}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="today">{t('today')}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="week">{t('thisWeek')}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="month">{t('thisMonth')}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop: Inline date filter */}
          <div className="hidden sm:block">
            <Select
              value={dateFilter}
              onValueChange={v => setDateFilter(v as 'all' | 'today' | 'week' | 'month')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('datePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allDates')}</SelectItem>
                <SelectItem value="today">{t('today')}</SelectItem>
                <SelectItem value="week">{t('thisWeek')}</SelectItem>
                <SelectItem value="month">{t('thisMonth')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Appointments View - List or Calendar */}
        {viewMode === 'calendar' ? (
          <CalendarGridView
            appointments={appointments || []}
            stylists={stylists}
            selectedDate={calendarDate}
            onDateChange={setCalendarDate}
            onAppointmentClick={handleEditAppointment}
          />
        ) : (
          <>
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
              <div className="space-y-4">
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
                  .sort(([a], [b]) => {
                    const timeA = new Date(a).getTime();
                    const timeB = new Date(b).getTime();
                    // For past tab, show most recent dates first
                    return activeTab === 'past' ? timeB - timeA : timeA - timeB;
                  })
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
                                    <span className="sr-only">{t('openMenu')}</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEditAppointment(appointment)}
                                  >
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
          </>
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
      </Tabs>

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

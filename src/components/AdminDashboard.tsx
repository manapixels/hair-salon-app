import { useState, useEffect, useMemo } from 'react';
import { toast, type ExternalToast } from 'sonner';
import { useBooking } from '../context/BookingContext';
import type { Appointment } from '../types';
import EditAppointmentModal from './EditAppointmentModal';
import StylistManagement from './StylistManagement';
import AvailabilityModeToggle, {
  type AvailabilityMode,
} from './admin/availability/AvailabilityModeToggle';
import SalonAvailability from './admin/availability/SalonAvailability';
import StylistAvailability from './admin/availability/StylistAvailability';
import SettingsLayout from './admin/settings/SettingsLayout';
import { formatDisplayDate, formatTime12Hour } from '@/lib/timeUtils';
import * as Tabs from '@radix-ui/react-tabs';
import * as Select from '@radix-ui/react-select';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { LoadingSpinner } from './loaders/LoadingSpinner';
import { LoadingButton } from './loaders/LoadingButton';
import { Button, Badge } from '@/components/ui';
import { Refresh, Edit, Delete, X } from '@/lib/icons';
import { DoubleArrowUpIcon } from '@radix-ui/react-icons';

const AdminDashboard: React.FC = () => {
  const {
    adminSettings,
    getAvailableSlots,
    blockTimeSlot,
    unblockTimeSlot,
    appointments,
    fetchAndSetAdminSettings,
    fetchAndSetAppointments,
    saveAdminSettings,
  } = useBooking();
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<
    'appointments' | 'stylists' | 'availability' | 'settings'
  >('appointments');
  const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>('salon-wide');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>(
    'all',
  );
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past' | 'today'>('all');
  const [sortField, setSortField] = useState<
    'date' | 'customer' | 'stylist' | 'price' | 'duration'
  >('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [previousAppointmentIds, setPreviousAppointmentIds] = useState<Set<string>>(new Set());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarExpanded, setCalendarExpanded] = useState(false);

  // AlertDialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [noShowDialogOpen, setNoShowDialogOpen] = useState(false);
  const [appointmentForNoShow, setAppointmentForNoShow] = useState<Appointment | null>(null);
  const [bulkCancelDialogOpen, setBulkCancelDialogOpen] = useState(false);

  useEffect(() => {
    // FIX: `fetchAndSetAdminSettings` returns `Promise<void>`, so its resolved value cannot be used.
    // This call triggers a context update, and another `useEffect` syncs the local state.
    const loadInitialData = async () => {
      setAppointmentsLoading(true);
      try {
        await Promise.all([fetchAndSetAdminSettings(), fetchAndSetAppointments()]);
        // Initialize previous appointment IDs to prevent false positives on first load
        const initialIds = new Set(appointments.map(apt => apt.id));
        setPreviousAppointmentIds(initialIds);
      } finally {
        setAppointmentsLoading(false);
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const toastId = toast.loading('Cancelling appointment...');
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

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      await fetchAndSetAppointments();
      toast.success('Appointment cancelled successfully', { id: toastId });
    } catch (error) {
      toast.error('Failed to cancel appointment', { id: toastId });
      console.error('Error cancelling appointment:', error);
    } finally {
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
    }
  };

  const handleMarkNoShow = (appointment: Appointment) => {
    setAppointmentForNoShow(appointment);
    setNoShowDialogOpen(true);
  };

  const confirmMarkNoShow = async () => {
    if (!appointmentForNoShow) return;

    const toastId = toast.loading('Marking as no-show...');
    try {
      const response = await fetch('/api/appointments/mark-no-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointmentForNoShow.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark as no-show');
      }

      await fetchAndSetAppointments();
      toast.success('Marked as no-show successfully', { id: toastId });
    } catch (error) {
      toast.error('Failed to mark as no-show', { id: toastId });
      console.error('Error marking as no-show:', error);
    } finally {
      setNoShowDialogOpen(false);
      setAppointmentForNoShow(null);
    }
  };

  const confirmBulkCancel = () => {
    // Bulk cancel logic would go here
    console.log('Bulk cancel:', Array.from(selectedAppointments));
    const count = selectedAppointments.size;
    setSelectedAppointments(new Set());
    setBulkCancelDialogOpen(false);
    toast.success(`${count} appointment${count > 1 ? 's' : ''} cancelled`);
  };

  const handleSaveAppointment = async (updatedData: Partial<Appointment>) => {
    if (!selectedAppointment) return;

    try {
      const response = await fetch('/api/appointments/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAppointment.id,
          ...updatedData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update appointment');
      }

      await fetchAndSetAppointments();
      setEditModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      throw error; // Re-throw for modal to handle
    }
  };

  // Memoize filtered appointments for performance
  const filteredAppointments = useMemo(() => {
    return (Array.isArray(appointments) ? appointments : []).filter(appointment => {
      // Enhanced text search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          // Customer information
          appointment.customerName.toLowerCase().includes(term) ||
          appointment.customerEmail.toLowerCase().includes(term) ||
          // Services
          appointment.services.some(s => s.name.toLowerCase().includes(term)) ||
          appointment.services.some(s => s.description.toLowerCase().includes(term)) ||
          // Appointment details
          appointment.id.toLowerCase().includes(term) ||
          appointment.time.includes(term) ||
          // Stylist information
          (appointment.stylist && appointment.stylist.name.toLowerCase().includes(term)) ||
          (appointment.stylist && appointment.stylist.email.toLowerCase().includes(term)) ||
          // Price and duration
          appointment.totalPrice.toString().includes(term) ||
          appointment.totalDuration.toString().includes(term);
        if (!matchesSearch) return false;
      }

      // Date range filter
      const getDateRange = () => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59,
        );

        switch (dateFilter) {
          case 'today':
            return { from: startOfDay, to: endOfDay };
          case 'week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            return { from: startOfWeek, to: endOfWeek };
          case 'month':
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
            return { from: startOfMonth, to: endOfMonth };
          case 'custom':
            if (customFromDate && customToDate) {
              const from = new Date(customFromDate);
              from.setHours(0, 0, 0, 0);
              const to = new Date(customToDate);
              to.setHours(23, 59, 59, 999);
              return { from, to };
            }
            return null;
          default:
            return null;
        }
      };

      const dateRange = getDateRange();
      if (dateRange) {
        const appointmentDate = new Date(appointment.date);
        if (appointmentDate < dateRange.from || appointmentDate > dateRange.to) {
          return false;
        }
      }

      // Status-based filter
      if (statusFilter !== 'all') {
        const appointmentDate = new Date(appointment.date);
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

        switch (statusFilter) {
          case 'today':
            if (appointmentDate < startOfToday || appointmentDate > endOfToday) {
              return false;
            }
            break;
          case 'upcoming':
            if (appointmentDate <= endOfToday) {
              return false;
            }
            break;
          case 'past':
            if (appointmentDate >= startOfToday) {
              return false;
            }
            break;
        }
      }

      return true;
    });
  }, [appointments, searchTerm, dateFilter, statusFilter, customFromDate, customToDate]);

  // Memoize sorted appointments for performance
  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          if (comparison === 0) {
            // If dates are the same, sort by time
            comparison = a.time.localeCompare(b.time);
          }
          break;
        case 'customer':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        case 'stylist':
          const stylistA = a.stylist?.name || 'No stylist assigned';
          const stylistB = b.stylist?.name || 'No stylist assigned';
          comparison = stylistA.localeCompare(stylistB);
          break;
        case 'price':
          comparison = a.totalPrice - b.totalPrice;
          break;
        case 'duration':
          comparison = a.totalDuration - b.totalDuration;
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredAppointments, sortField, sortDirection]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const appointmentsList = Array.isArray(appointments) ? appointments : [];

    const todayAppts = appointmentsList.filter(
      a => new Date(a.date) >= startOfToday && new Date(a.date) <= endOfToday,
    );

    const weekAppts = appointmentsList.filter(
      a => new Date(a.date) >= startOfWeek && new Date(a.date) <= endOfWeek,
    );

    const upcomingAppts = appointmentsList.filter(a => new Date(a.date) > endOfToday);

    return {
      today: todayAppts.length,
      thisWeek: weekAppts.length,
      upcoming: upcomingAppts.length,
      weekRevenue: weekAppts.reduce((sum, a) => sum + a.totalPrice, 0),
    };
  }, [appointments]);

  // Helper function to get date range based on filter
  const getDateRange = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    switch (dateFilter) {
      case 'today':
        return { from: startOfDay, to: endOfDay };
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { from: startOfWeek, to: endOfWeek };
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        return { from: startOfMonth, to: endOfMonth };
      case 'custom':
        if (customFromDate && customToDate) {
          const from = new Date(customFromDate);
          from.setHours(0, 0, 0, 0);
          const to = new Date(customToDate);
          to.setHours(23, 59, 59, 999);
          return { from, to };
        }
        return null;
      default:
        return null;
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = sortedAppointments.slice(startIndex, endIndex);

  // Handle sort column click
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Bulk selection functions
  const handleSelectAll = () => {
    if (selectedAppointments.size === paginatedAppointments.length) {
      setSelectedAppointments(new Set());
    } else {
      setSelectedAppointments(new Set(paginatedAppointments.map(apt => apt.id)));
    }
  };

  const handleSelectAppointment = (appointmentId: string) => {
    const newSelected = new Set(selectedAppointments);
    if (newSelected.has(appointmentId)) {
      newSelected.delete(appointmentId);
    } else {
      newSelected.add(appointmentId);
    }
    setSelectedAppointments(newSelected);
  };

  // Clear selection when filters change
  useEffect(() => {
    setSelectedAppointments(new Set());
  }, [dateFilter, statusFilter, searchTerm, currentPage]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAndSetAppointments();
      setLastRefresh(new Date());
      toast.success('Appointments refreshed', { duration: 2000 });
    } catch (error) {
      console.error('Failed to refresh appointments:', error);
      toast.error('Failed to refresh appointments');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      // Only auto-refresh if user is on appointments tab and page is visible
      if (activeTab !== 'appointments') return;
      if (document.visibilityState !== 'visible') return;

      if (!isRefreshing) {
        setIsRefreshing(true);
        try {
          await fetchAndSetAppointments();
          setLastRefresh(new Date());

          // Only show toast if there are NEW appointments
          const currentIds = new Set(appointments.map(apt => apt.id));
          const newAppointments = Array.from(currentIds).filter(
            id => !previousAppointmentIds.has(id),
          );

          if (newAppointments.length > 0) {
            toast.success(
              `${newAppointments.length} new appointment${newAppointments.length > 1 ? 's' : ''} received`,
              { duration: 4000 },
            );
          }

          setPreviousAppointmentIds(currentIds);
        } catch (error) {
          console.error('Failed to auto-refresh appointments:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [isRefreshing, fetchAndSetAppointments, activeTab, appointments, previousAppointmentIds]);

  // Helper function to get appointment urgency
  const getAppointmentUrgency = (appointment: Appointment) => {
    const now = new Date();
    const appointmentDateTime = new Date(appointment.date);
    const [hours, minutes] = appointment.time.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    const diffMs = appointmentDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) return 'past';
    if (diffHours < 2) return 'urgent';
    if (diffHours < 24) return 'today';
    if (diffHours < 168) return 'week';
    return 'future';
  };

  // Helper function to get time until appointment
  const getTimeUntil = (appointment: Appointment) => {
    const now = new Date();
    const appointmentDateTime = new Date(appointment.date);
    const [hours, minutes] = appointment.time.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    const diffMs = appointmentDateTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 0) return 'past';
    if (diffMinutes < 60) return `in ${diffMinutes}m`;
    if (diffHours < 24) return `in ${diffHours}h`;
    return null;
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAppointmentCountForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      const aptDate =
        apt.date instanceof Date
          ? apt.date.toISOString().split('T')[0]
          : String(apt.date).split('T')[0];
      return aptDate === dateStr;
    }).length;
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const handleCalendarDateClick = (date: Date) => {
    setSelectedCalendarDate(date);
    setDateFilter('custom');
    const dateStr = date.toISOString().split('T')[0];
    setCustomFromDate(dateStr);
    setCustomToDate(dateStr);
    setCurrentPage(1); // Reset to first page
  };

  // Sortable header component
  const SortableHeader = ({
    field,
    children,
    className = '',
  }: {
    field: typeof sortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-[var(--gray-2)] dark:hover:bg-gray-700 transition-colors ${className}`}
      onClick={() => handleSort(field)}
      aria-sort={
        sortField === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
      }
      role="columnheader"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSort(field);
        }
      }}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <div className="flex flex-col" aria-hidden="true">
          <svg
            className={`w-3 h-3 ${sortField === field && sortDirection === 'asc' ? 'text-accent' : 'text-gray-400'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <svg
            className={`w-3 h-3 -mt-1 ${sortField === field && sortDirection === 'desc' ? 'text-accent' : 'text-gray-400'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-[var(--gray-2)]">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <h1 className="text-3xl font-serif font-light text-[var(--gray-12)] mb-6">
          Admin Dashboard
        </h1>

        <Tabs.Root
          value={activeTab}
          onValueChange={value => setActiveTab(value as typeof activeTab)}
        >
          <Tabs.List
            className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-8"
            role="tablist"
          >
            <Tabs.Trigger
              value="appointments"
              className="px-3 py-3 text-base font-semibold border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              role="tab"
            >
              Appointments
            </Tabs.Trigger>
            <Tabs.Trigger
              value="stylists"
              className="px-3 py-3 text-base font-semibold border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              role="tab"
            >
              Stylists
            </Tabs.Trigger>
            <Tabs.Trigger
              value="availability"
              className="px-3 py-3 text-base font-semibold border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              role="tab"
            >
              Availability
            </Tabs.Trigger>
            <Tabs.Trigger
              value="settings"
              className="px-3 py-3 text-base font-semibold border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              role="tab"
            >
              Settings
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="appointments" className="focus:outline-none" role="tabpanel">
            {/* KPI Cards */}
            <section aria-labelledby="kpi-heading" className="mb-6">
              <h2 id="kpi-heading" className="sr-only">
                Key Performance Metrics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white p-5 border border-[var(--gray-6)] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Today</h3>
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis.today}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Appointments today
                  </p>
                </div>

                <div className="bg-white p-5 border border-[var(--gray-6)] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      This Week
                    </h3>
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {kpis.thisWeek}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Appointments this week
                  </p>
                </div>

                <div className="bg-white p-5 border border-[var(--gray-6)] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Upcoming
                    </h3>
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {kpis.upcoming}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Future appointments
                  </p>
                </div>

                <div className="bg-white p-5 border border-[var(--gray-6)] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Week Revenue
                    </h3>
                    <div className="w-10 h-10 rounded-full bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
                      <DoubleArrowUpIcon className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${kpis.weekRevenue}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Revenue this week</p>
                </div>
              </div>
            </section>

            {/* Appointments Management Section */}
            <section aria-label="Appointments management">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-serif font-light text-[var(--gray-12)]">
                    Appointments
                  </h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Showing {startIndex + 1}-{Math.min(endIndex, sortedAppointments.length)} of{' '}
                    {sortedAppointments.length} appointments
                    {filteredAppointments.length !== appointments.length && (
                      <span className="ml-1">({appointments.length} total)</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Last updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-[var(--gray-2)] dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Refresh appointments"
                      aria-label="Refresh appointments list"
                    >
                      <Refresh
                        className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="items-per-page"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
                    >
                      Per page:
                    </label>
                    <Select.Root
                      value={itemsPerPage.toString()}
                      onValueChange={value => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <Select.Trigger className="inline-flex items-center justify-between gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-2)] border border-[var(--gray-7)] bg-[var(--color-surface)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:border-[var(--gray-8)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] min-w-[70px]">
                        <Select.Value />
                        <Select.Icon>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="overflow-hidden bg-[var(--color-panel-solid)] rounded-[var(--radius-2)] border border-[var(--gray-6)] ">
                          <Select.Viewport className="p-[var(--space-1)]">
                            <Select.Item
                              value="10"
                              className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
                            >
                              <Select.ItemText>10</Select.ItemText>
                            </Select.Item>
                            <Select.Item
                              value="25"
                              className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
                            >
                              <Select.ItemText>25</Select.ItemText>
                            </Select.Item>
                            <Select.Item
                              value="50"
                              className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
                            >
                              <Select.ItemText>50</Select.ItemText>
                            </Select.Item>
                            <Select.Item
                              value="100"
                              className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
                            >
                              <Select.ItemText>100</Select.ItemText>
                            </Select.Item>
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="mb-6 p-5 bg-[var(--gray-2)] border border-[var(--gray-6)]">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <label
                      htmlFor="date-filter"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
                    >
                      Date:
                    </label>
                    <Select.Root
                      value={dateFilter}
                      onValueChange={value => setDateFilter(value as any)}
                    >
                      <Select.Trigger
                        id="date-filter"
                        className="inline-flex items-center justify-between gap-2 px-3 py-2 rounded-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent min-w-[140px]"
                        aria-label="Filter appointments by date range"
                      >
                        <Select.Value />
                        <Select.Icon>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="overflow-hidden bg-[var(--color-panel-solid)] rounded-[var(--radius-2)] border border-[var(--gray-6)] ">
                          <Select.Viewport className="p-[var(--space-1)]">
                            <Select.Item
                              value="all"
                              className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
                            >
                              <Select.ItemText>All Dates</Select.ItemText>
                            </Select.Item>
                            <Select.Item
                              value="today"
                              className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
                            >
                              <Select.ItemText>Today</Select.ItemText>
                            </Select.Item>
                            <Select.Item
                              value="week"
                              className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
                            >
                              <Select.ItemText>This Week</Select.ItemText>
                            </Select.Item>
                            <Select.Item
                              value="month"
                              className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
                            >
                              <Select.ItemText>This Month</Select.ItemText>
                            </Select.Item>
                            <Select.Item
                              value="custom"
                              className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
                            >
                              <Select.ItemText>Custom Range</Select.ItemText>
                            </Select.Item>
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>

                  <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" aria-hidden="true" />

                  <div className="flex items-center gap-3 min-w-[140px]">
                    <label
                      htmlFor="status-filter"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
                    >
                      Status:
                    </label>
                    <Select.Root
                      value={statusFilter}
                      onValueChange={value => setStatusFilter(value as any)}
                    >
                      <Select.Trigger
                        id="status-filter"
                        className="inline-flex items-center justify-between gap-2 px-3 py-2 rounded-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent min-w-[120px]"
                        aria-label="Filter appointments by status"
                      >
                        <Select.Value />
                        <Select.Icon>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="overflow-hidden bg-[var(--color-panel-solid)] rounded-[var(--radius-2)] border border-[var(--gray-6)] ">
                          <Select.Viewport className="p-[var(--space-1)]">
                            <Select.Item
                              value="all"
                              className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
                            >
                              <Select.ItemText>All Status</Select.ItemText>
                            </Select.Item>
                            <Select.Item
                              value="today"
                              className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
                            >
                              <Select.ItemText>Today</Select.ItemText>
                            </Select.Item>
                            <Select.Item
                              value="upcoming"
                              className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
                            >
                              <Select.ItemText>Upcoming</Select.ItemText>
                            </Select.Item>
                            <Select.Item
                              value="past"
                              className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
                            >
                              <Select.ItemText>Past</Select.ItemText>
                            </Select.Item>
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>

                  {dateFilter === 'custom' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                      <label htmlFor="custom-from-date" className="sr-only">
                        From date
                      </label>
                      <input
                        id="custom-from-date"
                        type="date"
                        value={customFromDate}
                        onChange={e => setCustomFromDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                        placeholder="From date"
                        aria-label="Custom date range start"
                      />
                      <span className="text-gray-600 dark:text-gray-400 text-sm">to</span>
                      <label htmlFor="custom-to-date" className="sr-only">
                        To date
                      </label>
                      <input
                        id="custom-to-date"
                        type="date"
                        value={customToDate}
                        onChange={e => setCustomToDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                        placeholder="To date"
                        aria-label="Custom date range end"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-[240px]">
                    <div className="relative">
                      <label htmlFor="appointment-search" className="sr-only">
                        Search appointments by customer name, email, service, or stylist
                      </label>
                      <input
                        id="appointment-search"
                        type="text"
                        placeholder="Search appointments..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-sm"
                        aria-label="Search appointments by customer, service, or stylist"
                      />
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  {(dateFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
                    <button
                      onClick={() => {
                        setDateFilter('all');
                        setStatusFilter('all');
                        setCustomFromDate('');
                        setCustomToDate('');
                        setSearchTerm('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-none transition-colors"
                      title="Clear all filters"
                      aria-label="Clear all appointment filters"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Live Region for Screen Readers */}
              <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {isRefreshing
                  ? 'Refreshing appointments...'
                  : `${sortedAppointments.length} appointment${sortedAppointments.length !== 1 ? 's' : ''} displayed`}
              </div>

              {/* Bulk Actions Toolbar */}
              {selectedAppointments.size > 0 && (
                <div className="mb-6 p-5 bg-[var(--accent-3)] border-2 border-[var(--accent-6)] animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-accent rounded-full ">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedAppointments.size} appointment
                          {selectedAppointments.size > 1 ? 's' : ''} selected
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Bulk actions available
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => setBulkCancelDialogOpen(true)}
                        className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-none hover:bg-red-700 transition-all hover:shadow-md active:scale-95"
                        aria-label={`Cancel ${selectedAppointments.size} selected appointments`}
                      >
                        <svg
                          className="w-4 h-4 inline mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Cancel Selected
                      </button>
                      <button
                        onClick={() => setSelectedAppointments(new Set())}
                        className="px-4 py-2 text-sm font-medium border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-none hover:bg-[var(--gray-2)] dark:hover:bg-gray-700 transition-all active:scale-95"
                        aria-label="Clear selection"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {appointmentsLoading ? (
                <div className="bg-[var(--gray-2)] dark:bg-gray-700 p-6 rounded-none text-center">
                  <LoadingSpinner size="md" message="Loading appointments..." />
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-none text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-[var(--gray-2)] dark:bg-gray-700 rounded-full flex items-center justify-center">
                      {appointments.length === 0 ? (
                        <svg
                          className="w-8 h-8 text-gray-400"
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
                      ) : (
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {appointments.length === 0 ? 'No Appointments Yet' : 'No Results Found'}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {appointments.length === 0
                          ? 'Appointments will appear here once customers start booking.'
                          : 'Try adjusting your filters or search terms.'}
                      </p>
                    </div>
                    {(dateFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
                      <button
                        onClick={() => {
                          setDateFilter('all');
                          setStatusFilter('all');
                          setSearchTerm('');
                          setCustomFromDate('');
                          setCustomToDate('');
                        }}
                        className="mt-4 px-4 py-2 text-sm font-medium bg-accent text-white rounded-none hover:bg-accent/90 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* CALENDAR + TABLE VIEW */
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Calendar Column */}
                  <div className="w-full lg:w-80 lg:flex-shrink-0">
                    {/* Calendar Toggle for Mobile */}
                    <button
                      onClick={() => setCalendarExpanded(!calendarExpanded)}
                      className="lg:hidden w-full mb-4 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[var(--gray-2)] dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                      aria-expanded={calendarExpanded}
                      aria-controls="calendar-sidebar"
                    >
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {calendarExpanded ? 'Hide' : 'Show'} Calendar
                      </span>
                      <svg
                        className={`w-5 h-5 transition-transform ${calendarExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    <div
                      id="calendar-sidebar"
                      className={`${calendarExpanded || 'hidden'} lg:block bg-white dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700 p-4  lg:sticky lg:top-6`}
                    >
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() =>
                            setCurrentMonth(
                              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
                            )
                          }
                          className="p-2 hover:bg-[var(--gray-2)] dark:hover:bg-gray-700 rounded transition-colors"
                          aria-label="Previous month"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {currentMonth.toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </h3>
                        <button
                          onClick={() =>
                            setCurrentMonth(
                              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
                            )
                          }
                          className="p-2 hover:bg-[var(--gray-2)] dark:hover:bg-gray-700 rounded transition-colors"
                          aria-label="Next month"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Clear Selection Button */}
                      {selectedCalendarDate && (
                        <button
                          onClick={() => {
                            setSelectedCalendarDate(null);
                            setDateFilter('all');
                            setCustomFromDate('');
                            setCustomToDate('');
                          }}
                          className="w-full mb-3 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-[var(--gray-2)] dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          Clear date filter
                        </button>
                      )}

                      {/* Day Labels */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                          <div
                            key={i}
                            className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-1"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Calendar">
                        {getDaysInMonth(currentMonth).map((date, index) => {
                          if (!date) {
                            return (
                              <div
                                key={`empty-${index}`}
                                className="aspect-square"
                                role="gridcell"
                              />
                            );
                          }

                          const appointmentCount = getAppointmentCountForDate(date);
                          const isSelected = isSameDay(date, selectedCalendarDate);
                          const isToday = isSameDay(date, new Date());
                          const hasAppointments = appointmentCount > 0;

                          const dateLabel = date.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          });
                          const ariaLabel = `${dateLabel}${hasAppointments ? `, ${appointmentCount} appointment${appointmentCount > 1 ? 's' : ''}` : ''}${isToday ? ', Today' : ''}${isSelected ? ', Currently selected' : ''}`;

                          return (
                            <button
                              key={date.toISOString()}
                              onClick={() => handleCalendarDateClick(date)}
                              className={`
                            aspect-square p-1 rounded-none text-sm transition-all relative
                            ${
                              isSelected
                                ? 'bg-accent text-white font-semibold  ring-2 ring-accent/50 ring-offset-2 dark:ring-offset-gray-800'
                                : isToday
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-semibold ring-2 ring-blue-300 dark:ring-blue-700'
                                  : hasAppointments
                                    ? 'bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-gray-100 hover:bg-green-100 dark:hover:bg-green-900/30'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-[var(--gray-2)] dark:hover:bg-gray-700'
                            }
                          `}
                              role="gridcell"
                              aria-label={ariaLabel}
                              aria-selected={isSelected}
                              aria-current={isToday ? 'date' : undefined}
                            >
                              <span className="block">{date.getDate()}</span>
                              {hasAppointments && !isSelected && (
                                <span
                                  className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 dark:bg-green-400 rounded-full"
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30" />
                          <span className="text-gray-600 dark:text-gray-400">Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" />
                          <span className="text-gray-600 dark:text-gray-400">Has appointments</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-accent" />
                          <span className="text-gray-600 dark:text-gray-400">Selected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Table Column */}
                  <div className="flex-1 min-w-0">
                    {paginatedAppointments.length === 0 ? (
                      <div
                        className="bg-white dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700  p-12"
                        role="status"
                      >
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="mb-4 p-4 bg-[var(--gray-2)] dark:bg-gray-700 rounded-full">
                            <svg
                              className="w-12 h-12 text-gray-400 dark:text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                              {appointments.length === 0
                                ? 'No Appointments Yet'
                                : 'No Results Found'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                              {appointments.length === 0
                                ? 'Appointments will appear here once customers start booking.'
                                : selectedCalendarDate
                                  ? `No appointments on ${formatDisplayDate(selectedCalendarDate.toISOString())}`
                                  : 'Try adjusting your filters or search terms.'}
                            </p>
                          </div>
                          {(dateFilter !== 'all' ||
                            statusFilter !== 'all' ||
                            searchTerm ||
                            selectedCalendarDate) && (
                            <button
                              onClick={() => {
                                setDateFilter('all');
                                setStatusFilter('all');
                                setSearchTerm('');
                                setCustomFromDate('');
                                setCustomToDate('');
                                setSelectedCalendarDate(null);
                              }}
                              className="mt-4 px-4 py-2 text-sm font-medium bg-accent text-white rounded-none hover:bg-accent/90 transition-colors"
                            >
                              Clear All Filters
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-[var(--gray-6)]">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-[var(--gray-6)]">
                            <thead className="bg-[var(--gray-3)]">
                              <tr>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                  <Checkbox.Root
                                    checked={
                                      selectedAppointments.size === paginatedAppointments.length &&
                                      paginatedAppointments.length > 0
                                    }
                                    onCheckedChange={handleSelectAll}
                                    className="flex items-center justify-center w-5 h-5 rounded-[var(--radius-1)] border border-[var(--gray-7)] bg-[var(--color-surface)] hover:border-[var(--gray-8)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] data-[state=checked]:bg-accent data-[state=checked]:border-[var(--accent-9)]"
                                  >
                                    <Checkbox.Indicator>
                                      <svg
                                        className="w-4 h-4 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={3}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    </Checkbox.Indicator>
                                  </Checkbox.Root>
                                </th>
                                <SortableHeader field="date">Date & Time</SortableHeader>
                                <SortableHeader field="customer">Customer</SortableHeader>
                                <SortableHeader field="stylist">Stylist</SortableHeader>
                                <SortableHeader field="price">Services & Price</SortableHeader>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {paginatedAppointments.map(appointment => (
                                <tr
                                  key={appointment.id}
                                  className={`hover:bg-[var(--gray-2)] ${selectedAppointments.has(appointment.id) ? 'bg-[var(--accent-3)]' : ''}`}
                                >
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <Checkbox.Root
                                      checked={selectedAppointments.has(appointment.id)}
                                      onCheckedChange={() =>
                                        handleSelectAppointment(appointment.id)
                                      }
                                      className="flex items-center justify-center w-5 h-5 rounded-[var(--radius-1)] border border-[var(--gray-7)] bg-[var(--color-surface)] hover:border-[var(--gray-8)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] data-[state=checked]:bg-accent data-[state=checked]:border-[var(--accent-9)]"
                                    >
                                      <Checkbox.Indicator>
                                        <svg
                                          className="w-4 h-4 text-white"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      </Checkbox.Indicator>
                                    </Checkbox.Root>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {formatDisplayDate(appointment.date)}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {(() => {
                                        const [hours, minutes] = appointment.time
                                          .split(':')
                                          .map(Number);
                                        const startTime = formatTime12Hour(appointment.time);
                                        const endMinutes =
                                          hours * 60 + minutes + appointment.totalDuration;
                                        const endHours = Math.floor(endMinutes / 60);
                                        const endMins = endMinutes % 60;
                                        const endTime = formatTime12Hour(
                                          `${endHours}:${String(endMins).padStart(2, '0')}`,
                                        );
                                        return `${startTime}-${endTime} (${appointment.totalDuration}m)`;
                                      })()}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {appointment.customerName}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {appointment.customerEmail}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {appointment.stylist
                                        ? appointment.stylist.name
                                        : 'No stylist assigned'}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                                      {appointment.services.map(s => s.name).join(', ')}
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                      ${appointment.totalPrice}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    {(() => {
                                      const status = (appointment as any).status || 'SCHEDULED';
                                      if (status === 'COMPLETED') {
                                        return (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Completed
                                          </span>
                                        );
                                      } else if (status === 'NO_SHOW') {
                                        return (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--gray-2)] text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            No-Show
                                          </span>
                                        );
                                      } else if (status === 'CANCELLED') {
                                        return (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                            Cancelled
                                          </span>
                                        );
                                      } else {
                                        return (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            Scheduled
                                          </span>
                                        );
                                      }
                                    })()}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-4">
                                      <button
                                        onClick={() => handleEditAppointment(appointment)}
                                        className="text-accent hover:text-accent dark:text-accent dark:hover:text-accent transition-colors"
                                        title="Edit appointment"
                                      >
                                        <svg
                                          className="h-5 w-5"
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                          <path
                                            fillRule="evenodd"
                                            d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleCancelAppointment(appointment)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                        title="Cancel appointment"
                                      >
                                        <svg
                                          className="h-5 w-5"
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </button>
                                      {(() => {
                                        const status = (appointment as any).status || 'SCHEDULED';
                                        const completedAt = (appointment as any).completedAt;
                                        const sevenDaysAgo = new Date(
                                          Date.now() - 7 * 24 * 60 * 60 * 1000,
                                        );
                                        const isRecentlyCompleted =
                                          status === 'COMPLETED' &&
                                          completedAt &&
                                          new Date(completedAt) > sevenDaysAgo;

                                        if (isRecentlyCompleted) {
                                          return (
                                            <button
                                              onClick={() => handleMarkNoShow(appointment)}
                                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                              title="Mark as no-show"
                                            >
                                              <svg
                                                className="h-5 w-5"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                              >
                                                <path
                                                  fillRule="evenodd"
                                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                                                  clipRule="evenodd"
                                                />
                                              </svg>
                                            </button>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-[var(--gray-2)] dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                Page {currentPage} of {totalPages}
                              </div>
                              <nav
                                className="flex items-center space-x-2"
                                role="navigation"
                                aria-label="Pagination"
                              >
                                <button
                                  onClick={() => setCurrentPage(1)}
                                  disabled={currentPage === 1}
                                  className="px-3 py-1 text-sm border rounded-none hover:bg-[var(--gray-2)] dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Go to first page"
                                >
                                  &laquo;
                                </button>
                                <button
                                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                  disabled={currentPage === 1}
                                  className="px-3 py-1 text-sm border rounded-none hover:bg-[var(--gray-2)] dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Go to previous page"
                                >
                                  &lsaquo;
                                </button>

                                {/* Page numbers */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  const pageNum =
                                    Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                  if (pageNum > totalPages) return null;
                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => setCurrentPage(pageNum)}
                                      className={`px-3 py-1 text-sm border rounded-none transition-colors ${
                                        currentPage === pageNum
                                          ? 'bg-accent border-accent text-white font-semibold'
                                          : 'hover:bg-[var(--gray-2)] dark:hover:bg-gray-700'
                                      }`}
                                      aria-label={`Go to page ${pageNum}`}
                                      aria-current={currentPage === pageNum ? 'page' : undefined}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                })}

                                <button
                                  onClick={() =>
                                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                                  }
                                  disabled={currentPage === totalPages}
                                  className="px-3 py-1 text-sm border rounded-none hover:bg-[var(--gray-2)] dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Go to next page"
                                >
                                  &rsaquo;
                                </button>
                                <button
                                  onClick={() => setCurrentPage(totalPages)}
                                  disabled={currentPage === totalPages}
                                  className="px-3 py-1 text-sm border rounded-none hover:bg-[var(--gray-2)] dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Go to last page"
                                >
                                  &raquo;
                                </button>
                              </nav>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </Tabs.Content>

          <Tabs.Content value="stylists" className="focus:outline-none" role="tabpanel">
            <StylistManagement onClose={() => {}} />
          </Tabs.Content>

          <Tabs.Content value="availability" className="focus:outline-none" role="tabpanel">
            <AvailabilityModeToggle mode={availabilityMode} onChange={setAvailabilityMode} />

            {availabilityMode === 'salon-wide' ? (
              <SalonAvailability
                adminSettings={adminSettings}
                appointments={appointments}
                getAvailableSlots={getAvailableSlots}
                blockTimeSlot={blockTimeSlot}
                unblockTimeSlot={unblockTimeSlot}
              />
            ) : (
              <StylistAvailability onNavigateToStylists={() => setActiveTab('stylists')} />
            )}
          </Tabs.Content>

          <Tabs.Content value="settings" className="focus:outline-none" role="tabpanel">
            <SettingsLayout adminSettings={adminSettings} onSave={saveAdminSettings} />
          </Tabs.Content>
        </Tabs.Root>

        {/* Edit Appointment Modal */}
        <EditAppointmentModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onSave={handleSaveAppointment}
        />

        {/* Cancel Appointment Dialog */}
        <AlertDialog.Root open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <AlertDialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-none bg-white dark:bg-gray-800 p-6  border border-gray-200 dark:border-gray-700 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
              <AlertDialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Cancel Appointment
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to cancel the appointment for{' '}
                {appointmentToCancel?.customerName}?
              </AlertDialog.Description>
              <div className="flex gap-3 justify-end">
                <AlertDialog.Cancel asChild>
                  <Button variant="soft" size="sm">
                    No
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button variant="danger" size="sm" onClick={confirmCancelAppointment}>
                    Yes, Cancel
                  </Button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>

        {/* No-Show Dialog */}
        <AlertDialog.Root open={noShowDialogOpen} onOpenChange={setNoShowDialogOpen}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <AlertDialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-none bg-white dark:bg-gray-800 p-6  border border-gray-200 dark:border-gray-700 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
              <AlertDialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Mark as No-Show
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Mark {appointmentForNoShow?.customerName} as no-show?
              </AlertDialog.Description>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                This will reverse their visit stats and exclude them from retention campaigns.
              </p>
              <div className="flex gap-3 justify-end">
                <AlertDialog.Cancel asChild>
                  <Button variant="soft" size="sm">
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button variant="solid" size="sm" onClick={confirmMarkNoShow}>
                    Yes, Mark No-Show
                  </Button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>

        {/* Bulk Cancel Dialog */}
        <AlertDialog.Root open={bulkCancelDialogOpen} onOpenChange={setBulkCancelDialogOpen}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <AlertDialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-none bg-white dark:bg-gray-800 p-6  border border-gray-200 dark:border-gray-700 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
              <AlertDialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Cancel Multiple Appointments
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to cancel {selectedAppointments.size} appointment
                {selectedAppointments.size > 1 ? 's' : ''}?
              </AlertDialog.Description>
              <div className="flex gap-3 justify-end">
                <AlertDialog.Cancel asChild>
                  <Button variant="soft" size="sm">
                    No
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button variant="danger" size="sm" onClick={confirmBulkCancel}>
                    Yes, Cancel All
                  </Button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
    </div>
  );
};

export default AdminDashboard;

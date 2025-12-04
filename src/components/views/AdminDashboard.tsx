import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useBooking } from '@/context/BookingContext';
import type { Appointment } from '@/types';
import EditAppointmentModal from '../booking/EditAppointmentModal';
import StylistManagement from '../team/StylistManagement';
import AvailabilityModeToggle, {
  type AvailabilityMode,
} from '../admin/availability/AvailabilityModeToggle';
import SalonAvailability from '../admin/availability/SalonAvailability';
import StylistAvailability from '../admin/availability/StylistAvailability';
import SettingsLayout from '../admin/settings/SettingsLayout';
import ChatDashboard from '../admin/ChatDashboard';
import KnowledgeBaseManager from '../admin/KnowledgeBaseManager';
import { formatDisplayDate, formatTime12Hour } from '@/lib/timeUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
import { LoadingSpinner } from '../feedback/loaders/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Refresh } from '@/lib/icons';
import { ChevronsUp } from 'lucide-react';

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
    'appointments' | 'stylists' | 'availability' | 'settings' | 'chat' | 'knowledge-base'
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
          appointment.services.some(s => s.description?.toLowerCase().includes(term)) ||
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
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-muted transition-colors ${className}`}
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
    <div className="min-h-screen bg-muted">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <h1 className="text-3xl font-serif font-light text-foreground mb-6">Admin Dashboard</h1>

        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="stylists">Stylists</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="chat">Chat Management</TabsTrigger>
            <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="focus:outline-none">
            {/* KPI Cards */}
            <section aria-labelledby="kpi-heading" className="mb-6">
              <h2 id="kpi-heading" className="sr-only">
                Key Performance Metrics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white p-5 border border-border transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600">Today</h3>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600"
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
                  <p className="text-3xl font-bold text-gray-900">{kpis.today}</p>
                  <p className="text-xs text-gray-500 mt-1">Appointments today</p>
                </div>

                <div className="bg-white p-5 border border-border transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600">This Week</h3>
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-600"
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
                  <p className="text-3xl font-bold text-gray-900">{kpis.thisWeek}</p>
                  <p className="text-xs text-gray-500 mt-1">Appointments this week</p>
                </div>

                <div className="bg-white p-5 border border-border transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600">Upcoming</h3>
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-yellow-600"
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
                  <p className="text-3xl font-bold text-gray-900">{kpis.upcoming}</p>
                  <p className="text-xs text-gray-500 mt-1">Future appointments</p>
                </div>

                <div className="bg-white p-5 border border-border transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600">Week Revenue</h3>
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <ChevronsUp className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">${kpis.weekRevenue}</p>
                  <p className="text-xs text-gray-500 mt-1">Revenue this week</p>
                </div>
              </div>
            </section>

            {/* Appointments Management Section */}
            <section aria-label="Appointments management">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-serif font-light text-foreground">Appointments</h2>
                  <div className="text-sm text-gray-600 mt-1">
                    Showing {startIndex + 1}-{Math.min(endIndex, sortedAppointments.length)} of{' '}
                    {sortedAppointments.length} appointments
                    {filteredAppointments.length !== appointments.length && (
                      <span className="ml-1">({appointments.length} total)</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500">
                      Last updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      className="text-sm font-medium text-gray-700 whitespace-nowrap"
                    >
                      Per page:
                    </label>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={value => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="inline-flex items-center justify-between gap-[2] px-3 py-2 rounded-md border border-gray-300 bg-background text-sm text-foreground hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent min-w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="overflow-hidden bg-card rounded-md border border-border ">
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="mb-6 p-5 bg-muted border border-border">
                <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <label
                      htmlFor="date-filter"
                      className="text-sm font-medium text-gray-700 whitespace-nowrap"
                    >
                      Date:
                    </label>
                    <Select value={dateFilter} onValueChange={value => setDateFilter(value as any)}>
                      <SelectTrigger
                        id="date-filter"
                        className="flex-1 md:flex-none inline-flex items-center justify-between gap-2 px-3 py-2 rounded-none border border-gray-300 bg-white text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent min-w-[140px]"
                        aria-label="Filter appointments by date range"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="overflow-hidden bg-card rounded-md border border-border ">
                        <SelectItem value="all">All Dates</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="hidden md:block h-8 w-px bg-gray-300" aria-hidden="true" />

                  <div className="flex items-center gap-3 min-w-[140px]">
                    <label
                      htmlFor="status-filter"
                      className="text-sm font-medium text-gray-700 whitespace-nowrap"
                    >
                      Status:
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={value => setStatusFilter(value as any)}
                    >
                      <SelectTrigger
                        id="status-filter"
                        className="flex-1 md:flex-none inline-flex items-center justify-between gap-2 px-3 py-2 rounded-none border border-gray-300 bg-white text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent min-w-[120px]"
                        aria-label="Filter appointments by status"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="overflow-hidden bg-card rounded-md border border-border ">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="past">Past</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {dateFilter === 'custom' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                      <label htmlFor="custom-from-date" className="sr-only">
                        From date
                      </label>
                      <input
                        id="custom-from-date"
                        type="date"
                        value={customFromDate}
                        onChange={e => setCustomFromDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-none text-sm bg-white text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent hover:border-gray-400 transition-colors"
                        placeholder="From date"
                        aria-label="Custom date range start"
                      />
                      <span className="text-gray-600 text-sm text-center sm:text-left">to</span>
                      <label htmlFor="custom-to-date" className="sr-only">
                        To date
                      </label>
                      <input
                        id="custom-to-date"
                        type="date"
                        value={customToDate}
                        onChange={e => setCustomToDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-none text-sm bg-white text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent hover:border-gray-400 transition-colors"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent hover:border-gray-400 transition-colors text-sm"
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
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-none transition-colors w-full md:w-auto"
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
                <div className="mb-6 p-5 bg-accent/10 border-2 border-[hsl(var(--accent))] animate-in slide-in-from-top-2 fade-in duration-300">
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
                        <div className="text-sm font-semibold text-gray-900">
                          {selectedAppointments.size} appointment
                          {selectedAppointments.size > 1 ? 's' : ''} selected
                        </div>
                        <div className="text-xs text-gray-600">Bulk actions available</div>
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
                        className="px-4 py-2 text-sm font-medium border-2 border-gray-300 text-gray-700 rounded-none hover:bg-muted transition-all active:scale-95"
                        aria-label="Clear selection"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {appointmentsLoading ? (
                <div className="bg-muted p-6 rounded-none text-center">
                  <LoadingSpinner size="md" message="Loading appointments..." />
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="bg-white p-12 rounded-none text-center border-2 border-dashed border-gray-300">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {appointments.length === 0 ? 'No Appointments Yet' : 'No Results Found'}
                      </h3>
                      <p className="text-gray-500 text-sm">
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
                      className="lg:hidden w-full mb-4 px-4 py-2 bg-white border border-gray-200 rounded-none text-sm font-medium text-gray-700 hover:bg-muted transition-colors flex items-center justify-between"
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
                      className={`${calendarExpanded || 'hidden'} lg:block bg-white rounded-none border border-gray-200 p-4  lg:sticky lg:top-6`}
                    >
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() =>
                            setCurrentMonth(
                              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
                            )
                          }
                          className="p-2 hover:bg-muted rounded transition-colors"
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
                        <h3 className="text-lg font-semibold text-gray-900">
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
                          className="p-2 hover:bg-muted rounded transition-colors"
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
                          className="w-full mb-3 px-3 py-1.5 text-sm text-gray-600 hover:bg-muted rounded transition-colors"
                        >
                          Clear date filter
                        </button>
                      )}

                      {/* Day Labels */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                          <div
                            key={i}
                            className="text-center text-xs font-semibold text-gray-600 py-1"
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
                                ? 'bg-accent text-white font-semibold  ring-2 ring-accent/50 ring-offset-2'
                                : isToday
                                  ? 'bg-blue-100 text-blue-900 font-semibold ring-2 ring-blue-300'
                                  : hasAppointments
                                    ? 'bg-green-50 text-gray-900 hover:bg-green-100'
                                    : 'text-gray-600 hover:bg-muted'
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
                                  className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-blue-100" />
                          <span className="text-gray-600">Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-green-50 border border-green-200" />
                          <span className="text-gray-600">Has appointments</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-accent" />
                          <span className="text-gray-600">Selected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Table Column */}
                  <div className="flex-1 min-w-0">
                    {paginatedAppointments.length === 0 ? (
                      <div
                        className="bg-white rounded-none border border-gray-200  p-12"
                        role="status"
                      >
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="mb-4 p-4 bg-muted rounded-full">
                            <svg
                              className="w-12 h-12 text-gray-400"
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {appointments.length === 0
                                ? 'No Appointments Yet'
                                : 'No Results Found'}
                            </h3>
                            <p className="text-gray-500 text-sm">
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
                      <div className="bg-white border border-border">
                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-200">
                          {paginatedAppointments.map(appointment => (
                            <div
                              key={appointment.id}
                              className={`p-4 ${selectedAppointments.has(appointment.id) ? 'bg-accent/10' : ''}`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={selectedAppointments.has(appointment.id)}
                                    onCheckedChange={() => handleSelectAppointment(appointment.id)}
                                    className="flex items-center justify-center w-5 h-5 rounded-sm border border-gray-300 bg-background hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent data-[state=checked]:bg-accent data-[state=checked]:border-[hsl(var(--accent))]"
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {appointment.customerName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {appointment.customerEmail}
                                    </div>
                                  </div>
                                </div>
                                {(() => {
                                  const status = (appointment as any).status || 'SCHEDULED';
                                  if (status === 'COMPLETED') {
                                    return (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Completed
                                      </span>
                                    );
                                  } else if (status === 'NO_SHOW') {
                                    return (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-gray-800">
                                        No-Show
                                      </span>
                                    );
                                  } else if (status === 'CANCELLED') {
                                    return (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Cancelled
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Scheduled
                                      </span>
                                    );
                                  }
                                })()}
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Date & Time</div>
                                  <div className="text-gray-900">
                                    {formatDisplayDate(appointment.date)}
                                  </div>
                                  <div className="text-gray-500 text-xs">
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
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Stylist</div>
                                  <div className="text-gray-900">
                                    {appointment.stylist
                                      ? appointment.stylist.name
                                      : 'No stylist assigned'}
                                  </div>
                                </div>
                              </div>

                              <div className="mb-3">
                                <div className="text-xs text-gray-500 mb-1">Services</div>
                                <div className="text-sm text-gray-900">
                                  {appointment.services.map(s => s.name).join(', ')}
                                </div>
                                <div className="text-sm font-semibold text-gray-900 mt-1">
                                  ${appointment.totalPrice}
                                </div>
                              </div>

                              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                  onClick={() => handleEditAppointment(appointment)}
                                  className="flex items-center gap-1 text-sm text-accent hover:text-accent transition-colors"
                                >
                                  <svg
                                    className="h-4 w-4"
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
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleCancelAppointment(appointment)}
                                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-900 transition-colors"
                                >
                                  <svg
                                    className="h-4 w-4"
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
                                  Cancel
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
                                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                      >
                                        <svg
                                          className="h-4 w-4"
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        No-Show
                                      </button>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="hidden md:block overflow-x-auto">
                          <table className="min-w-full divide-y divide-[hsl(var(--border))]">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  <Checkbox
                                    checked={
                                      selectedAppointments.size === paginatedAppointments.length &&
                                      paginatedAppointments.length > 0
                                    }
                                    onCheckedChange={handleSelectAll}
                                    className="flex items-center justify-center w-5 h-5 rounded-sm border border-gray-300 bg-background hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent data-[state=checked]:bg-accent data-[state=checked]:border-[hsl(var(--accent))]"
                                  />
                                </th>
                                <SortableHeader field="date">Date & Time</SortableHeader>
                                <SortableHeader field="customer">Customer</SortableHeader>
                                <SortableHeader field="stylist">Stylist</SortableHeader>
                                <SortableHeader field="price">Services & Price</SortableHeader>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {paginatedAppointments.map(appointment => (
                                <tr
                                  key={appointment.id}
                                  className={`hover:bg-muted ${selectedAppointments.has(appointment.id) ? 'bg-accent/10' : ''}`}
                                >
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <Checkbox
                                      checked={selectedAppointments.has(appointment.id)}
                                      onCheckedChange={() =>
                                        handleSelectAppointment(appointment.id)
                                      }
                                      className="flex items-center justify-center w-5 h-5 rounded-sm border border-gray-300 bg-background hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent data-[state=checked]:bg-accent data-[state=checked]:border-[hsl(var(--accent))]"
                                    />
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatDisplayDate(appointment.date)}
                                    </div>
                                    <div className="text-sm text-gray-500">
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
                                    <div className="text-sm font-medium text-gray-900">
                                      {appointment.customerName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {appointment.customerEmail}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {appointment.stylist
                                        ? appointment.stylist.name
                                        : 'No stylist assigned'}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="text-sm text-gray-900 mb-1">
                                      {appointment.services.map(s => s.name).join(', ')}
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900">
                                      ${appointment.totalPrice}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    {(() => {
                                      const status = (appointment as any).status || 'SCHEDULED';
                                      if (status === 'COMPLETED') {
                                        return (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Completed
                                          </span>
                                        );
                                      } else if (status === 'NO_SHOW') {
                                        return (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-gray-800">
                                            No-Show
                                          </span>
                                        );
                                      } else if (status === 'CANCELLED') {
                                        return (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Cancelled
                                          </span>
                                        );
                                      } else {
                                        return (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
                                        className="text-accent hover:text-accent transition-colors"
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
                                        className="text-red-600 hover:text-red-900 transition-colors"
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
                                              className="text-gray-600 hover:text-gray-900 transition-colors"
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
                          <div className="px-6 py-4 border-t border-gray-200 bg-muted">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-700">
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
                                  className="px-3 py-1 text-sm border rounded-none hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Go to first page"
                                >
                                  &laquo;
                                </button>
                                <button
                                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                  disabled={currentPage === 1}
                                  className="px-3 py-1 text-sm border rounded-none hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                          : 'hover:bg-muted'
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
                                  className="px-3 py-1 text-sm border rounded-none hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Go to next page"
                                >
                                  &rsaquo;
                                </button>
                                <button
                                  onClick={() => setCurrentPage(totalPages)}
                                  disabled={currentPage === totalPages}
                                  className="px-3 py-1 text-sm border rounded-none hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          </TabsContent>

          <TabsContent value="stylists" className="focus:outline-none">
            <StylistManagement onClose={() => {}} />
          </TabsContent>

          <TabsContent value="availability" className="focus:outline-none">
            <div className="space-y-6">
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
            </div>
          </TabsContent>

          <TabsContent value="settings" className="focus:outline-none">
            <SettingsLayout adminSettings={adminSettings} onSave={saveAdminSettings} />
          </TabsContent>

          <TabsContent value="chat" className="focus:outline-none">
            <ChatDashboard />
          </TabsContent>

          <TabsContent value="knowledge-base" className="focus:outline-none">
            <KnowledgeBaseManager />
          </TabsContent>
        </Tabs>

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
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-none bg-white p-6  border border-gray-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900 mb-2">
                Cancel Appointment
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-600 mb-4">
                Are you sure you want to cancel the appointment for{' '}
                {appointmentToCancel?.customerName}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="secondary" size="sm">
                  No
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive" size="sm" onClick={confirmCancelAppointment}>
                  Yes, Cancel
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* No-Show Dialog */}
        <AlertDialog open={noShowDialogOpen} onOpenChange={setNoShowDialogOpen}>
          <AlertDialogContent className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-none bg-white p-6  border border-gray-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900 mb-2">
                Mark as No-Show
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-600 mb-1">
                Mark {appointmentForNoShow?.customerName} as no-show?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <p className="text-xs text-gray-500 mb-4">
              This will reverse their visit stats and exclude them from retention campaigns.
            </p>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="secondary" size="sm">
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="default" size="sm" onClick={confirmMarkNoShow}>
                  Yes, Mark No-Show
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Cancel Dialog */}
        <AlertDialog open={bulkCancelDialogOpen} onOpenChange={setBulkCancelDialogOpen}>
          <AlertDialogContent className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-none bg-white p-6  border border-gray-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900 mb-2">
                Cancel Multiple Appointments
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-600 mb-4">
                Are you sure you want to cancel {selectedAppointments.size} appointment
                {selectedAppointments.size > 1 ? 's' : ''}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="secondary" size="sm">
                  No
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive" size="sm" onClick={confirmBulkCancel}>
                  Yes, Cancel All
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminDashboard;

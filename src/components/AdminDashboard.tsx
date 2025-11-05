import { useState, useEffect } from 'react';
import { toast, type ExternalToast } from 'sonner';
import { useBooking } from '../context/BookingContext';
import type { TimeSlot, Appointment } from '../types';
import EditAppointmentModal from './EditAppointmentModal';
import StylistManagement from './StylistManagement';
import { formatDisplayDate } from '@/lib/timeUtils';
import * as Tabs from '@radix-ui/react-tabs';
import * as Select from '@radix-ui/react-select';
import * as Checkbox from '@radix-ui/react-checkbox';
import { TextField } from './ui/TextField';

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState(adminSettings.weeklySchedule);
  const [closedDates, setClosedDates] = useState<string[]>(adminSettings.closedDates);
  const [newClosedDate, setNewClosedDate] = useState('');
  const [businessName, setBusinessName] = useState(adminSettings.businessName);
  const [businessAddress, setBusinessAddress] = useState(adminSettings.businessAddress);
  const [businessPhone, setBusinessPhone] = useState(adminSettings.businessPhone);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'appointments' | 'stylists' | 'availability'>(
    'appointments',
  );
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

  useEffect(() => {
    // FIX: `fetchAndSetAdminSettings` returns `Promise<void>`, so its resolved value cannot be used.
    // This call triggers a context update, and another `useEffect` syncs the local state.
    fetchAndSetAdminSettings();
    fetchAndSetAppointments();

    // Initialize previous appointment IDs to prevent false positives on first load
    const initialIds = new Set(appointments.map(apt => apt.id));
    setPreviousAppointmentIds(initialIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setWeeklySchedule(adminSettings.weeklySchedule);
    setClosedDates(adminSettings.closedDates);
    setBusinessName(adminSettings.businessName);
    setBusinessAddress(adminSettings.businessAddress);
    setBusinessPhone(adminSettings.businessPhone);
  }, [adminSettings]);

  useEffect(() => {
    const fetchAndProcessSlots = async () => {
      setLoading(true);
      const availableSlotsList = await getAvailableSlots(selectedDate);

      // Get day-specific schedule
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const daySchedule = weeklySchedule[dayOfWeek as keyof typeof weeklySchedule];
      const allSlots =
        daySchedule && daySchedule.isOpen
          ? generateAllTimeSlots(daySchedule.openingTime, daySchedule.closingTime)
          : [];

      // Validate appointments is an array before filtering
      const apptTimes = Array.isArray(appointments)
        ? appointments
            .filter(a => new Date(a.date).toDateString() === selectedDate.toDateString())
            .map(a => a.time)
        : [];

      const processedSlots = allSlots.map(slot => {
        let isAvailable = availableSlotsList.includes(slot.time) && !apptTimes.includes(slot.time);

        return {
          time: slot.time,
          available: isAvailable,
        };
      });
      setTimeSlots(processedSlots);
      setLoading(false);
    };

    fetchAndProcessSlots();
  }, [selectedDate, weeklySchedule, appointments, getAvailableSlots]);

  const handleTimeSlotClick = async (time: string, isAvailable: boolean) => {
    // Optimistic update
    setTimeSlots(prev =>
      prev.map(slot => (slot.time === time ? { ...slot, available: !isAvailable } : slot)),
    );
    try {
      if (isAvailable) {
        await blockTimeSlot(selectedDate, time);
      } else {
        await unblockTimeSlot(selectedDate, time);
      }
    } catch (error) {
      // Revert on error
      setTimeSlots(prev =>
        prev.map(slot => (slot.time === time ? { ...slot, available: isAvailable } : slot)),
      );
      toast.error('Failed to update slot.');
    }
  };

  const generateAllTimeSlots = (start: string, end: string) => {
    const slots: TimeSlot[] = [];
    let currentTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    while (currentTime < endTime) {
      slots.push({ time: currentTime.toTimeString().substring(0, 5), available: true });
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    return slots;
  };

  const handleSettingsSave = async () => {
    const toastId = toast.loading('Saving settings...');
    try {
      await saveAdminSettings({
        ...adminSettings,
        weeklySchedule,
        closedDates,
        businessName,
        businessAddress,
        businessPhone,
      });
      toast.success('Settings saved successfully!', { id: toastId });
    } catch (error) {
      toast.error('Failed to save settings.', { id: toastId });
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditModalOpen(true);
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    toast.custom(
      (t: string | number) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-3">
            <p className="font-medium text-gray-900 dark:text-white">
              Are you sure you want to cancel the appointment for {appointment.customerName}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  toast.dismiss(t);
                  const toastId = toast.loading('Cancelling appointment...');
                  try {
                    const response = await fetch('/api/appointments/cancel', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customerEmail: appointment.customerEmail,
                        date: appointment.date.toISOString().split('T')[0],
                        time: appointment.time,
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
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => toast.dismiss(t)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  const handleMarkNoShow = async (appointment: Appointment) => {
    toast.custom(
      (t: string | number) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-3">
            <p className="font-medium text-gray-900 dark:text-white">
              Mark {appointment.customerName} as no-show?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This will reverse their visit stats and exclude them from retention campaigns.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  toast.dismiss(t);
                  const toastId = toast.loading('Marking as no-show...');
                  try {
                    const response = await fetch('/api/appointments/mark-no-show', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        appointmentId: appointment.id,
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
                  }
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Yes, Mark No-Show
              </button>
              <button
                onClick={() => toast.dismiss(t)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
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

  const filteredAppointments = (Array.isArray(appointments) ? appointments : []).filter(
    appointment => {
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
    },
  );

  // Sort filtered appointments
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
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
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <div className="flex flex-col">
          <i
            className={`fas fa-caret-up text-xs ${sortField === field && sortDirection === 'asc' ? 'text-yellow-500' : 'text-gray-400'}`}
          ></i>
          <i
            className={`fas fa-caret-down text-xs -mt-1 ${sortField === field && sortDirection === 'desc' ? 'text-yellow-500' : 'text-gray-400'}`}
          ></i>
        </div>
      </div>
    </th>
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Salon Management</h2>
        <span className="px-4 py-2 text-sm font-semibold rounded-full bg-accent-soft text-accent dark:bg-accent-soft dark:text-accent">
          Admin
        </span>
      </div>

      {/* Tab Navigation */}
      <Tabs.Root
        value={activeTab}
        onValueChange={value => setActiveTab(value as typeof activeTab)}
        className="mb-[var(--space-8)]"
      >
        <Tabs.List className="flex gap-[var(--space-6)] border-b border-[var(--gray-6)]">
          <Tabs.Trigger
            value="appointments"
            className="px-[var(--space-2)] py-[var(--space-3)] text-[length:var(--font-size-3)] font-semibold border-b-2 border-transparent data-[state=active]:border-[var(--accent-9)] data-[state=active]:text-[var(--accent-11)] text-[var(--gray-11)] hover:text-[var(--gray-12)] transition-colors"
          >
            Appointments
          </Tabs.Trigger>
          <Tabs.Trigger
            value="stylists"
            className="px-[var(--space-2)] py-[var(--space-3)] text-[length:var(--font-size-3)] font-semibold border-b-2 border-transparent data-[state=active]:border-[var(--accent-9)] data-[state=active]:text-[var(--accent-11)] text-[var(--gray-11)] hover:text-[var(--gray-12)] transition-colors"
          >
            Stylists
          </Tabs.Trigger>
          <Tabs.Trigger
            value="availability"
            className="px-[var(--space-2)] py-[var(--space-3)] text-[length:var(--font-size-3)] font-semibold border-b-2 border-transparent data-[state=active]:border-[var(--accent-9)] data-[state=active]:text-[var(--accent-11)] text-[var(--gray-11)] hover:text-[var(--gray-12)] transition-colors"
          >
            Availability & Settings
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="appointments">
          {/* Appointments Management Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Customer Appointment Management</h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, sortedAppointments.length)} of{' '}
                  {sortedAppointments.length} appointments
                  {filteredAppointments.length !== appointments.length && (
                    <span className="ml-1">({appointments.length} total)</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-400">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Refresh appointments"
                  >
                    <i className={`fas fa-sync-alt ${isRefreshing ? 'animate-spin' : ''}`}></i>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-[length:var(--font-size-2)] text-[var(--gray-11)]">
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
                      <Select.Content className="overflow-hidden bg-[var(--color-panel-solid)] rounded-[var(--radius-2)] border border-[var(--gray-6)] shadow-lg">
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

            {/* Date Filter Controls */}
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-[length:var(--font-size-2)] font-medium text-[var(--gray-12)]">
                    Date Filter:
                  </label>
                  <Select.Root
                    value={dateFilter}
                    onValueChange={value => setDateFilter(value as any)}
                  >
                    <Select.Trigger className="inline-flex items-center justify-between gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-2)] border border-[var(--gray-7)] bg-[var(--color-surface)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:border-[var(--gray-8)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] min-w-[140px]">
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
                      <Select.Content className="overflow-hidden bg-[var(--color-panel-solid)] rounded-[var(--radius-2)] border border-[var(--gray-6)] shadow-lg">
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

                <div className="flex items-center space-x-2">
                  <label className="text-[length:var(--font-size-2)] font-medium text-[var(--gray-12)]">
                    Status:
                  </label>
                  <Select.Root
                    value={statusFilter}
                    onValueChange={value => setStatusFilter(value as any)}
                  >
                    <Select.Trigger className="inline-flex items-center justify-between gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-2)] border border-[var(--gray-7)] bg-[var(--color-surface)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:border-[var(--gray-8)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] min-w-[120px]">
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
                      <Select.Content className="overflow-hidden bg-[var(--color-panel-solid)] rounded-[var(--radius-2)] border border-[var(--gray-6)] shadow-lg">
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
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={customFromDate}
                      onChange={e => setCustomFromDate(e.target.value)}
                      className="px-[var(--space-3)] py-[var(--space-2)] border border-[var(--gray-7)] rounded-[var(--radius-2)] text-[length:var(--font-size-2)] bg-[var(--color-surface)] text-[var(--gray-12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] focus-visible:border-[var(--accent-8)] hover:border-[var(--gray-8)] transition-colors"
                      placeholder="From date"
                    />
                    <span className="text-[var(--gray-11)]">to</span>
                    <input
                      type="date"
                      value={customToDate}
                      onChange={e => setCustomToDate(e.target.value)}
                      className="px-[var(--space-3)] py-[var(--space-2)] border border-[var(--gray-7)] rounded-[var(--radius-2)] text-[length:var(--font-size-2)] bg-[var(--color-surface)] text-[var(--gray-12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] focus-visible:border-[var(--accent-8)] hover:border-[var(--gray-8)] transition-colors"
                      placeholder="To date"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-[var(--space-2)] border border-[var(--gray-7)] rounded-[var(--radius-2)] bg-[var(--color-surface)] text-[var(--gray-12)] placeholder:text-[var(--gray-9)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] focus-visible:border-[var(--accent-8)] hover:border-[var(--gray-8)] transition-colors"
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
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Clear all filters"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedAppointments.size > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {selectedAppointments.size} appointment
                    {selectedAppointments.size > 1 ? 's' : ''} selected
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        toast.custom(
                          (t: string | number) => (
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex flex-col gap-3">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  Are you sure you want to cancel {selectedAppointments.size}{' '}
                                  appointment{selectedAppointments.size > 1 ? 's' : ''}?
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      toast.dismiss(t);
                                      // Bulk cancel logic would go here
                                      console.log('Bulk cancel:', Array.from(selectedAppointments));
                                      setSelectedAppointments(new Set());
                                      toast.success(
                                        `${selectedAppointments.size} appointment${selectedAppointments.size > 1 ? 's' : ''} cancelled`,
                                      );
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => toast.dismiss(t)}
                                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                            </div>
                          ),
                          { duration: Infinity },
                        );
                      }}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      <i className="fas fa-trash mr-1"></i>
                      Cancel Selected
                    </button>
                    <button
                      onClick={() => setSelectedAppointments(new Set())}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}

            {filteredAppointments.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {appointments.length === 0
                    ? 'No appointments booked yet.'
                    : 'No appointments match your search.'}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
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
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Services
                        </th>
                        <SortableHeader field="duration">Duration</SortableHeader>
                        <SortableHeader field="price">Price</SortableHeader>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedAppointments.map(appointment => (
                        <tr
                          key={appointment.id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedAppointments.has(appointment.id) ? 'bg-accent-soft dark:bg-accent-soft' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Checkbox.Root
                              checked={selectedAppointments.has(appointment.id)}
                              onCheckedChange={() => handleSelectAppointment(appointment.id)}
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatDisplayDate(appointment.date)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {appointment.time}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {appointment.customerName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {appointment.customerEmail}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {appointment.stylist
                                ? appointment.stylist.name
                                : 'No stylist assigned'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {appointment.services.map(s => s.name).join(', ')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {appointment.totalDuration} mins
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            ${appointment.totalPrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
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
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
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
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="First page"
                        >
                          &laquo;
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Previous page"
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
                              className={`px-3 py-1 text-sm border rounded-lg ${
                                currentPage === pageNum
                                  ? 'bg-accent border-accent'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Next page"
                        >
                          &rsaquo;
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Last page"
                        >
                          &raquo;
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Tabs.Content>

        <Tabs.Content value="stylists">
          <StylistManagement onClose={() => {}} />
        </Tabs.Content>

        <Tabs.Content value="availability">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Operating Hours */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Weekly Schedule</h3>
              <div className="space-y-3">
                {Object.entries(weeklySchedule).map(([day, schedule]) => (
                  <div key={day} className="grid grid-cols-4 gap-3 items-center">
                    <div className="flex items-center">
                      <Checkbox.Root
                        id={`${day}-open`}
                        checked={schedule.isOpen}
                        onCheckedChange={checked =>
                          setWeeklySchedule({
                            ...weeklySchedule,
                            [day]: { ...schedule, isOpen: checked === true },
                          })
                        }
                        className="flex items-center justify-center w-5 h-5 mr-3 rounded-[var(--radius-1)] border border-[var(--gray-7)] bg-[var(--color-surface)] hover:border-[var(--gray-8)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] data-[state=checked]:bg-accent data-[state=checked]:border-[var(--accent-9)]"
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
                      <label
                        htmlFor={`${day}-open`}
                        className="text-[length:var(--font-size-2)] font-medium capitalize text-[var(--gray-12)]"
                      >
                        {day}
                      </label>
                    </div>
                    <input
                      type="time"
                      value={schedule.openingTime}
                      onChange={e =>
                        setWeeklySchedule({
                          ...weeklySchedule,
                          [day]: { ...schedule, openingTime: e.target.value },
                        })
                      }
                      disabled={!schedule.isOpen}
                      className="px-[var(--space-3)] py-[var(--space-2)] border border-[var(--gray-7)] rounded-[var(--radius-2)] text-[length:var(--font-size-2)] bg-[var(--color-surface)] text-[var(--gray-12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] focus-visible:border-[var(--accent-8)] hover:border-[var(--gray-8)] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--gray-2)] transition-colors"
                      step="1800"
                    />
                    <span className="text-center text-[length:var(--font-size-2)] text-[var(--gray-11)]">
                      to
                    </span>
                    <input
                      type="time"
                      value={schedule.closingTime}
                      onChange={e =>
                        setWeeklySchedule({
                          ...weeklySchedule,
                          [day]: { ...schedule, closingTime: e.target.value },
                        })
                      }
                      disabled={!schedule.isOpen}
                      className="px-[var(--space-3)] py-[var(--space-2)] border border-[var(--gray-7)] rounded-[var(--radius-2)] text-[length:var(--font-size-2)] bg-[var(--color-surface)] text-[var(--gray-12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] focus-visible:border-[var(--accent-8)] hover:border-[var(--gray-8)] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--gray-2)] transition-colors"
                      step="1800"
                    />
                  </div>
                ))}
              </div>

              {/* Closed Dates Section */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold mb-3">Special Closed Dates</h4>
                <div className="space-y-2">
                  {closedDates.map(date => (
                    <div
                      key={date}
                      className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"
                    >
                      <span className="text-sm font-medium">{date}</span>
                      <button
                        onClick={() => setClosedDates(closedDates.filter(d => d !== date))}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="date"
                      value={newClosedDate}
                      onChange={e => setNewClosedDate(e.target.value)}
                      className="flex-1 p-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <button
                      onClick={() => {
                        if (newClosedDate && !closedDates.includes(newClosedDate)) {
                          setClosedDates([...closedDates, newClosedDate].sort());
                          setNewClosedDate('');
                        }
                      }}
                      disabled={!newClosedDate}
                      className="px-4 py-2 bg-accent rounded-lg text-sm font-semibold hover:bg-accent disabled:opacity-50"
                    >
                      Add Date
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Business Information</h3>
              <div className="space-y-4">
                <TextField
                  label="Business Name"
                  id="businessName"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                />
                <TextField
                  label="Address"
                  id="businessAddress"
                  value={businessAddress}
                  onChange={e => setBusinessAddress(e.target.value)}
                />
                <TextField
                  label="Phone Number"
                  type="tel"
                  id="businessPhone"
                  value={businessPhone}
                  onChange={e => setBusinessPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSettingsSave}
              className="bg-accent px-8 py-3 rounded-lg hover:bg-accent transition-colors font-semibold text-base"
            >
              Save Settings
            </button>
          </div>

          {/* Stats Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl mt-8">
            <h3 className="text-xl font-semibold mb-2">Appointments Today</h3>
            <p className="text-5xl font-bold text-accent">
              {
                (Array.isArray(appointments) ? appointments : []).filter(
                  a => new Date(a.date).toDateString() === new Date().toDateString(),
                ).length
              }
            </p>
          </div>

          {/* Appointments Management Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Customer Appointment Management</h3>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search appointments..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredAppointments.length} of {appointments.length} appointments
                </div>
              </div>
            </div>
            {filteredAppointments.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {appointments.length === 0
                    ? 'No appointments booked yet.'
                    : 'No appointments match your search.'}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Services
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {paginatedAppointments.map(appointment => (
                        <tr
                          key={appointment.id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-600 ${selectedAppointments.has(appointment.id) ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedAppointments.has(appointment.id)}
                              onChange={() => handleSelectAppointment(appointment.id)}
                              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {formatDisplayDate(appointment.date)}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {appointment.time}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {(() => {
                                  const appointmentDate = new Date(appointment.date);
                                  const today = new Date();
                                  const startOfToday = new Date(
                                    today.getFullYear(),
                                    today.getMonth(),
                                    today.getDate(),
                                  );
                                  const endOfToday = new Date(
                                    today.getFullYear(),
                                    today.getMonth(),
                                    today.getDate(),
                                    23,
                                    59,
                                    59,
                                  );

                                  if (
                                    appointmentDate >= startOfToday &&
                                    appointmentDate <= endOfToday
                                  ) {
                                    return (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        <i className="fas fa-clock mr-1"></i>
                                        Today
                                      </span>
                                    );
                                  } else if (appointmentDate > endOfToday) {
                                    return (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        <i className="fas fa-calendar-plus mr-1"></i>
                                        Upcoming
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                        <i className="fas fa-history mr-1"></i>
                                        Past
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {appointment.customerName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {appointment.customerEmail}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {appointment.services.map(s => s.name).join(', ')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {appointment.totalDuration} mins
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            ${appointment.totalPrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const status = (appointment as any).status || 'SCHEDULED';
                              if (status === 'COMPLETED') {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <i className="fas fa-check-circle mr-1"></i>
                                    Completed
                                  </span>
                                );
                              } else if (status === 'NO_SHOW') {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                    <i className="fas fa-user-slash mr-1"></i>
                                    No-Show
                                  </span>
                                );
                              } else if (status === 'CANCELLED') {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    <i className="fas fa-times-circle mr-1"></i>
                                    Cancelled
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    <i className="fas fa-calendar-check mr-1"></i>
                                    Scheduled
                                  </span>
                                );
                              }
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditAppointment(appointment)}
                                className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors"
                                title="Edit appointment"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(appointment)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                title="Cancel appointment"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                              {(() => {
                                const status = (appointment as any).status || 'SCHEDULED';
                                const completedAt = (appointment as any).completedAt;
                                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
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
                                      <i className="fas fa-user-slash"></i>
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
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Manage Availability</h3>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={e => setSelectedDate(new Date(e.target.value))}
              className="w-full md:w-auto p-2 border rounded-md bg-white dark:bg-gray-600 dark:border-gray-500 mb-4"
            />
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {timeSlots.map(({ time, available }) => {
                  const isBooked = appointments.some(
                    a =>
                      new Date(a.date).toDateString() === selectedDate.toDateString() &&
                      a.time === time,
                  );
                  let buttonClass = '';
                  if (isBooked) {
                    buttonClass = 'bg-red-500 text-white cursor-not-allowed';
                  } else if (available) {
                    buttonClass =
                      'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-700';
                  } else {
                    buttonClass =
                      'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-500';
                  }

                  return (
                    <button
                      key={time}
                      onClick={() => !isBooked && handleTimeSlotClick(time, available)}
                      disabled={isBooked}
                      className={`p-3 rounded-md text-sm font-medium transition-colors text-center ${buttonClass}`}
                    >
                      {time}
                      {isBooked && <span className="block text-xs mt-1">Booked</span>}
                      {!isBooked &&
                        (available ? (
                          <span className="block text-xs mt-1">Available</span>
                        ) : (
                          <span className="block text-xs mt-1">Blocked</span>
                        ))}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
    </div>
  );
};

export default AdminDashboard;

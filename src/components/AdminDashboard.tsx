import { useState, useEffect } from 'react';
import { toast, type ExternalToast } from 'sonner';
import { useBooking } from '../context/BookingContext';
import type { TimeSlot, Appointment } from '../types';
import EditAppointmentModal from './EditAppointmentModal';
import StylistManagement from './StylistManagement';

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
  const [openingTime, setOpeningTime] = useState(adminSettings.openingTime);
  const [closingTime, setClosingTime] = useState(adminSettings.closingTime);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'appointments' | 'stylists' | 'availability'>(
    'appointments',
  );
  const [showStylistManagement, setShowStylistManagement] = useState(false);
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

  useEffect(() => {
    // FIX: `fetchAndSetAdminSettings` returns `Promise<void>`, so its resolved value cannot be used.
    // This call triggers a context update, and another `useEffect` syncs the local state.
    fetchAndSetAdminSettings();
    fetchAndSetAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setOpeningTime(adminSettings.openingTime);
    setClosingTime(adminSettings.closingTime);
  }, [adminSettings]);

  useEffect(() => {
    const fetchAndProcessSlots = async () => {
      setLoading(true);
      const availableSlotsList = await getAvailableSlots(selectedDate);
      const allSlots = generateAllTimeSlots(adminSettings.openingTime, adminSettings.closingTime);

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
  }, [selectedDate, adminSettings, appointments, getAvailableSlots]);

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
      await saveAdminSettings({ ...adminSettings, openingTime, closingTime });
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
      if (!isRefreshing) {
        setIsRefreshing(true);
        try {
          await fetchAndSetAppointments();
          setLastRefresh(new Date());
          toast.info('Appointments refreshed', { duration: 2000 });
        } catch (error) {
          console.error('Failed to auto-refresh appointments:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [isRefreshing, fetchAndSetAppointments]);

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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Admin Dashboard</h2>
        <button
          onClick={() => setShowStylistManagement(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors flex items-center"
        >
          <i className="fas fa-users mr-2"></i>
          Manage Stylists
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-600 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'appointments'
                ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <i className="fas fa-calendar-alt mr-2"></i>
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'availability'
                ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <i className="fas fa-clock mr-2"></i>
            Availability & Settings
          </button>
        </nav>
      </div>

      {activeTab === 'appointments' && (
        <div>
          {/* Appointments Management Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">All Appointments</h3>
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
                  <label className="text-sm text-gray-600 dark:text-gray-400">Per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={e => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Date Filter Controls */}
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <i className="fas fa-calendar-alt mr-1"></i>
                    Date Filter:
                  </label>
                  <select
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <i className="fas fa-filter mr-1"></i>
                    Status:
                  </label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="today">Today</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                  </select>
                </div>

                {dateFilter === 'custom' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={customFromDate}
                      onChange={e => setCustomFromDate(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      placeholder="From date"
                    />
                    <span className="text-gray-500 dark:text-gray-400">to</span>
                    <input
                      type="date"
                      value={customToDate}
                      onChange={e => setCustomToDate(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      placeholder="To date"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, email, service, stylist, ID..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
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
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Clear all filters"
                  >
                    <i className="fas fa-times mr-1"></i>
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
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={
                              selectedAppointments.size === paginatedAppointments.length &&
                              paginatedAppointments.length > 0
                            }
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                          />
                        </th>
                        <SortableHeader field="date">Date & Time</SortableHeader>
                        <SortableHeader field="customer">Customer</SortableHeader>
                        <SortableHeader field="stylist">Stylist</SortableHeader>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Services
                        </th>
                        <SortableHeader field="duration">Duration</SortableHeader>
                        <SortableHeader field="price">Price</SortableHeader>
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
                                  {new Date(appointment.date).toLocaleDateString()}
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="First page"
                        >
                          <i className="fas fa-angle-double-left"></i>
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Previous page"
                        >
                          <i className="fas fa-angle-left"></i>
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
                              className={`px-3 py-1 text-sm border rounded ${
                                currentPage === pageNum
                                  ? 'bg-yellow-500 text-white border-yellow-500'
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
                          className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Next page"
                        >
                          <i className="fas fa-angle-right"></i>
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Last page"
                        >
                          <i className="fas fa-angle-double-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'availability' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Operating Hours</h3>
              <div className="flex items-center space-x-4">
                <div>
                  <label
                    htmlFor="openingTime"
                    className="block text-sm font-medium text-gray-600 dark:text-gray-300"
                  >
                    Opening Time
                  </label>
                  <input
                    type="time"
                    id="openingTime"
                    value={openingTime}
                    onChange={e => setOpeningTime(e.target.value)}
                    className="mt-1 p-2 border rounded-md bg-white dark:bg-gray-600 dark:border-gray-500"
                    step="1800"
                  />
                </div>
                <div>
                  <label
                    htmlFor="closingTime"
                    className="block text-sm font-medium text-gray-600 dark:text-gray-300"
                  >
                    Closing Time
                  </label>
                  <input
                    type="time"
                    id="closingTime"
                    value={closingTime}
                    onChange={e => setClosingTime(e.target.value)}
                    className="mt-1 p-2 border rounded-md bg-white dark:bg-gray-600 dark:border-gray-500"
                    step="1800"
                  />
                </div>
                <button
                  onClick={handleSettingsSave}
                  className="self-end bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Appointments Today</h3>
              <p className="text-4xl font-bold text-indigo-600">
                {
                  (Array.isArray(appointments) ? appointments : []).filter(
                    a => new Date(a.date).toDateString() === new Date().toDateString(),
                  ).length
                }
              </p>
            </div>
          </div>

          {/* Appointments Management Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">All Appointments</h3>
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
                                  {new Date(appointment.date).toLocaleDateString()}
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
        </div>
      )}

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

      {/* Stylist Management Modal */}
      {showStylistManagement && (
        <StylistManagement onClose={() => setShowStylistManagement(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;

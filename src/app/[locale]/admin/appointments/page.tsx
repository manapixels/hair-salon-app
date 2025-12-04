'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useBooking } from '@/context/BookingContext';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import EditAppointmentModal from '@/components/booking/EditAppointmentModal';
import type { Appointment } from '@/types';
import { formatDisplayDate, formatTime12Hour } from '@/lib/timeUtils';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export default function AppointmentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { appointments, fetchAndSetAppointments } = useBooking();
  const router = useRouter();

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
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

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
    toast.success('Appointments refreshed');
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
      if (!response.ok) throw new Error('Failed to cancel');
      await fetchAndSetAppointments();
      toast.success('Appointment cancelled', { id: toastId });
    } catch {
      toast.error('Failed to cancel appointment', { id: toastId });
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
      const error = await response.json();
      throw new Error(error.message || 'Failed to update');
    }
    await fetchAndSetAppointments();
    setEditModalOpen(false);
    setSelectedAppointment(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <AdminLayout title="Appointments">
      <div className="space-y-6">
        {/* Header Row */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, sortedAppointments.length)} of{' '}
              {sortedAppointments.length} appointments
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <Refresh className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white border border-border rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or service..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <Select value={dateFilter} onValueChange={v => setDateFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Appointments List */}
        {appointmentsLoading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="md" message="Loading appointments..." />
          </div>
        ) : paginatedAppointments.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground">No appointments found</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg divide-y divide-border">
            {paginatedAppointments.map(appointment => (
              <div key={appointment.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{appointment.customerName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.customerEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDisplayDate(appointment.date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime12Hour(appointment.time)} ({appointment.totalDuration}m)
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">{appointment.services.map(s => s.name).join(', ')}</p>
                    <p className="text-sm font-semibold">${appointment.totalPrice}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAppointment(appointment)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelAppointment(appointment)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

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
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the appointment for{' '}
              {appointmentToCancel?.customerName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelAppointment}>Yes, Cancel</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

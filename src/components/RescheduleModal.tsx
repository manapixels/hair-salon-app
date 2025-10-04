'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Appointment, TimeSlot } from '@/types';
import { useBooking } from '@/context/BookingContext';
import { formatDisplayDate } from '@/lib/timeUtils';

interface RescheduleModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RescheduleModal({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const { getAvailableSlots } = useBooking();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date());
      setSelectedTime(null);
      setTimeSlots([]);
    }
  }, [isOpen]);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedDate, isOpen]);

  const fetchTimeSlots = async () => {
    setLoading(true);
    try {
      const availableSlots = await getAvailableSlots(
        selectedDate,
        appointment.stylistId || undefined,
      );
      const slots = availableSlots.map(slot => ({ time: slot, available: true }));
      setTimeSlots(slots);
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
      toast.error('Unable to load available times');
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both a date and time');
      return;
    }

    // Check if the new date/time is different from current
    const currentDateTime = `${appointment.date.toISOString().split('T')[0]} ${appointment.time}`;
    const newDateTime = `${selectedDate.toISOString().split('T')[0]} ${selectedTime}`;

    if (currentDateTime === newDateTime) {
      toast.warning('Please select a different date and time');
      return;
    }

    setIsRescheduling(true);
    const toastId = toast.loading('Rescheduling appointment...');

    try {
      const response = await fetch('/api/appointments/user-reschedule', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: appointment.id,
          newDate: selectedDate.toISOString().split('T')[0],
          newTime: selectedTime,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Appointment rescheduled successfully!', { id: toastId });
        onSuccess();
        onClose();
      } else {
        throw new Error(data.error || 'Failed to reschedule appointment');
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reschedule appointment', {
        id: toastId,
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              <i className="fa-solid fa-edit text-indigo-600 mr-2"></i>
              Reschedule Appointment
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              disabled={isRescheduling}
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Current Appointment Info */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Current Appointment Details:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Date: </span>
              <span className="text-gray-900 dark:text-white">
                {formatDisplayDate(appointment.date)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Time: </span>
              <span className="text-gray-900 dark:text-white">{appointment.time}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Services: </span>
              <span className="text-gray-900 dark:text-white">
                {appointment.services.map(s => s.name).join(', ')}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Total: </span>
              <span className="text-gray-900 dark:text-white">${appointment.totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select New Date & Time
          </h3>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Date:
            </label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setSelectedDate(new Date(e.target.value))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isRescheduling}
            />
          </div>

          {/* Time Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Times:
            </label>

            {loading ? (
              <div className="text-center py-8">
                <i className="fa-solid fa-spinner fa-spin text-2xl text-indigo-600 mb-2"></i>
                <p className="text-gray-600 dark:text-gray-400">Loading available times...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-8">
                <i className="fa-solid fa-calendar-times text-2xl text-gray-400 mb-2"></i>
                <p className="text-gray-600 dark:text-gray-400">No available times for this date</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {timeSlots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedTime(slot.time)}
                    disabled={!slot.available || isRescheduling}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      selectedTime === slot.time
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : slot.available
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-gray-600'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isRescheduling}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedTime || isRescheduling}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRescheduling ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Rescheduling...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check mr-2"></i>
                  Reschedule Appointment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Appointment, TimeSlot } from '@/types';
import { useBooking } from '@/context/BookingContext';
import { Button, Dialog } from '@radix-ui/themes';
import {
  formatDisplayDate,
  formatTime12Hour,
  toDateInputValue,
  isSameDay,
  getMinDateForInput,
  combineDateTimeToUTC,
} from '@/lib/timeUtils';
import { cn } from '@/lib/utils';

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

  // Memoized fetch function to satisfy dependency array
  const fetchTimeSlots = useCallback(async () => {
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
  }, [selectedDate, appointment.stylistId, getAvailableSlots]);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedDate, isOpen, fetchTimeSlots]);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both a date and time');
      return;
    }

    // Check if the new date/time is different from current (timezone-safe)
    const appointmentDate = new Date(appointment.date);
    const isSameDateSelected = isSameDay(selectedDate, appointmentDate);
    const isSameTimeSelected = selectedTime === appointment.time;

    if (isSameDateSelected && isSameTimeSelected) {
      toast.warning('Please select a different date or time');
      return;
    }

    setIsRescheduling(true);
    const toastId = toast.loading('Rescheduling appointment...');

    try {
      // Convert local date/time to UTC for database storage
      const utcDateTime = combineDateTimeToUTC(toDateInputValue(selectedDate), selectedTime);

      const response = await fetch('/api/appointments/user-reschedule', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: appointment.id,
          newDate: toDateInputValue(selectedDate),
          newTime: selectedTime,
          utcDateTime, // Send UTC for server-side consistency
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

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => (!open ? onClose() : undefined)}>
      <Dialog.Content className="max-w-2xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Dialog.Title>Reschedule Appointment</Dialog.Title>
            <Dialog.Description>
              Choose a new date and time that works best for you.
            </Dialog.Description>
          </div>
          <Dialog.Close>
            <Button
              variant="ghost"
              className="h-10 w-10 rounded-full p-0 text-gray-500"
              disabled={isRescheduling}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              <span className="sr-only">Close reschedule modal</span>
            </Button>
          </Dialog.Close>
        </div>

        <section className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-800/60">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Current Appointment Details
          </h3>
          <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-gray-600 dark:text-gray-300">Date</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">
                {formatDisplayDate(appointment.date)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600 dark:text-gray-300">Time</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">
                {formatTime12Hour(appointment.time)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600 dark:text-gray-300">Services</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">
                {appointment.services.map(s => s.name).join(', ')}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600 dark:text-gray-300">Total</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">
                ${appointment.totalPrice}
              </dd>
            </div>
          </dl>
        </section>

        <section className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Date
            </label>
            <input
              type="date"
              value={toDateInputValue(selectedDate)}
              min={getMinDateForInput()}
              onChange={e => {
                const [year, month, day] = e.target.value.split('-').map(Number);
                setSelectedDate(new Date(year, month - 1, day));
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              disabled={isRescheduling}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Available Times
            </label>

            {loading ? (
              <div className="py-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">Loading available times...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">No available times for this date</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
                {timeSlots.map(slot => {
                  const isSelected = selectedTime === slot.time;
                  const isAvailable = slot.available;

                  return (
                    <Button
                      key={slot.time}
                      variant={isSelected ? 'solid' : 'soft'}
                      className={cn(
                        'h-auto w-full px-3 py-2 text-xs font-semibold',
                        isSelected
                          ? ''
                          : isAvailable
                            ? 'border-gray-300 bg-white text-gray-700 hover:border-accent hover:text-accent dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'
                            : 'border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500',
                      )}
                      onClick={() => setSelectedTime(slot.time)}
                      disabled={!isAvailable || isRescheduling}
                    >
                      {formatTime12Hour(slot.time)}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button variant="soft" onClick={onClose} disabled={isRescheduling}>
            Cancel
          </Button>
          <Button
            onClick={handleReschedule}
            loading={isRescheduling}
            disabled={!selectedDate || !selectedTime}
          >
            Reschedule Appointment
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}

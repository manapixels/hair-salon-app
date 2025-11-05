'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Appointment, Service } from '../types';
import { SALON_SERVICES } from '../constants';
import { Button, Checkbox, Dialog, Select } from '@radix-ui/themes';
import { formatTime12Hour } from '@/lib/timeUtils';
import { TextField } from './ui/TextField';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSave: (updatedAppointment: Partial<Appointment>) => Promise<void>;
}

export default function EditAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onSave,
}: EditAppointmentModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    date: '',
    time: '',
    services: [] as Service[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (appointment) {
      setFormData({
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        date: format(new Date(appointment.date), 'yyyy-MM-dd'),
        time: appointment.time,
        services: appointment.services,
      });
    }
  }, [appointment]);

  const handleServiceToggle = (service: Service) => {
    setFormData(prev => {
      const isSelected = prev.services.some(s => s.id === service.id);
      if (isSelected) {
        return {
          ...prev,
          services: prev.services.filter(s => s.id !== service.id),
        };
      } else {
        return {
          ...prev,
          services: [...prev.services, service],
        };
      }
    });
  };

  const calculateTotals = () => {
    const totalPrice = formData.services.reduce((sum, service) => sum + service.price, 0);
    const totalDuration = formData.services.reduce((sum, service) => sum + service.duration, 0);
    return { totalPrice, totalDuration };
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.customerName || !formData.customerEmail || !formData.date || !formData.time) {
      const errorMsg = 'Please fill in all required fields';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (formData.services.length === 0) {
      const errorMsg = 'Please select at least one service';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Updating appointment...');

    try {
      const { totalPrice, totalDuration } = calculateTotals();
      await onSave({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        date: new Date(formData.date),
        time: formData.time,
        services: formData.services,
        totalPrice,
        totalDuration,
      });
      toast.success('Appointment updated successfully!', { id: toastId });
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update appointment';
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const { totalPrice, totalDuration } = calculateTotals();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open: boolean) => (!open ? onClose() : undefined)}>
      <Dialog.Content className="max-h-[90vh] w-full max-w-3xl overflow-y-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Dialog.Title>Edit Appointment</Dialog.Title>
            <Dialog.Description>
              Update customer details, services, and scheduled time for this appointment.
            </Dialog.Description>
          </div>
          <Dialog.Close>
            <Button variant="ghost" className="h-10 w-10 rounded-full p-0 text-gray-500">
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              <span className="sr-only">Close edit appointment modal</span>
            </Button>
          </Dialog.Close>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TextField
              label="Customer Name *"
              type="text"
              value={formData.customerName}
              onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              required
            />
            <TextField
              label="Customer Email *"
              type="email"
              value={formData.customerEmail}
              onChange={e => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
              required
            />
            <TextField
              label="Date *"
              type="date"
              value={formData.date}
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              min={format(new Date(), 'yyyy-MM-dd')}
              required
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Time *
              </label>
              <Select.Root
                value={formData.time || undefined}
                onValueChange={value => setFormData(prev => ({ ...prev, time: value }))}
              >
                <Select.Trigger placeholder="Select time" />
                <Select.Content>
                  {generateTimeSlots().map(slot => (
                    <Select.Item key={slot} value={slot}>
                      {formatTime12Hour(slot)}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Services *
            </label>
            <div className="grid max-h-64 grid-cols-1 gap-3 overflow-y-auto rounded-lg border border-gray-200 p-4 sm:grid-cols-2 dark:border-gray-600">
              {SALON_SERVICES.map(service => {
                const isSelected = formData.services.some(s => s.id === service.id);
                const checkboxId = `service-${service.id}`;

                return (
                  <div
                    key={service.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? 'border-accent bg-accent-soft dark:bg-accent-soft'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={isSelected}
                      onCheckedChange={() => handleServiceToggle(service)}
                      aria-labelledby={`${checkboxId}-label`}
                    />
                    <div className="flex-1" id={`${checkboxId}-label`}>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {service.name}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {formData.services.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                Appointment Summary
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Duration:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {totalDuration} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Price:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${totalPrice}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <Button type="button" variant="soft" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={isLoading}
              disabled={formData.services.length === 0}
            >
              Update Appointment
            </Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

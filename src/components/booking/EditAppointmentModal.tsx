'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Appointment, Service } from '@/types';
// Services are now fetched from API instead of hardcoded constants
import { Button, Checkbox, Select } from '@radix-ui/themes';
import { formatTime12Hour } from '@/lib/timeUtils';
import { TextField } from '@/components/ui/TextField';
import { useIsMobile } from '@/hooks/useMediaQuery';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { X } from 'lucide-react';

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
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch available services
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        const data = await response.json();
        // Flatten categories to get all services
        const allServices = data.flatMap((category: any) => category.items);
        setAvailableServices(allServices);
      } catch (err) {
        console.error('Failed to fetch services:', err);
      }
    };
    fetchServices();
  }, []);

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
    const totalPrice = formData.services.reduce((sum, service) => sum + service.basePrice, 0);
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
  const isMobile = useIsMobile();

  const content = (
    <div className="p-6">
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextField
            label="Customer Name *"
            type="text"
            value={formData.customerName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, customerName: e.target.value }))
            }
            required
          />
          <TextField
            label="Customer Email *"
            type="email"
            value={formData.customerEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, customerEmail: e.target.value }))
            }
            required
          />
          <TextField
            label="Date *"
            type="date"
            value={formData.date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, date: e.target.value }))
            }
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
            {availableServices.map(service => {
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
                    <h4 className="font-semibold text-gray-900 dark:text-white">{service.name}</h4>
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

        <div className="flex gap-3 md:gap-4 pt-6">
          <Button
            type="button"
            variant="soft"
            className="flex-1 min-h-touch-lg active-scale"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 min-h-touch-lg active-scale"
            loading={isLoading}
            disabled={formData.services.length === 0}
          >
            Update Appointment
          </Button>
        </div>
      </form>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={open => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Appointment</DrawerTitle>
            <DrawerDescription>
              Update customer details, services, and scheduled time for this appointment.
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-white shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="flex items-center justify-between border-b p-6">
            <div>
              <Dialog.Title className="text-lg font-semibold">Edit Appointment</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-600">
                Update customer details, services, and scheduled time for this appointment.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          {content}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

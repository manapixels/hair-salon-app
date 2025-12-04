'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Appointment, Service } from '@/types';
// Services are now fetched from API instead of hardcoded constants
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatTime12Hour } from '@/lib/timeUtils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Loader2 } from 'lucide-react';

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
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Label>Customer Name</Label>
          <Input
            type="text"
            value={formData.customerName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, customerName: e.target.value }))
            }
            required
          />
          <Label>Customer Email</Label>
          <Input
            type="email"
            value={formData.customerEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, customerEmail: e.target.value }))
            }
            required
          />
          <Label>Date</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({ ...prev, date: e.target.value }))
            }
            min={format(new Date(), 'yyyy-MM-dd')}
            required
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Time *</label>
            <Select
              value={formData.time || undefined}
              onValueChange={value => setFormData(prev => ({ ...prev, time: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {generateTimeSlots().map(slot => (
                  <SelectItem key={slot} value={slot}>
                    {formatTime12Hour(slot)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Services *</label>
          <div className="grid max-h-64 grid-cols-1 gap-3 overflow-y-auto rounded-lg border border-gray-200 p-4 sm:grid-cols-2">
            {availableServices.map(service => {
              const isSelected = formData.services.some(s => s.id === service.id);
              const checkboxId = `service-${service.id}`;

              return (
                <div
                  key={service.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    isSelected ? 'border-primary bg-primary/10' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Checkbox
                    id={checkboxId}
                    checked={isSelected}
                    onCheckedChange={() => handleServiceToggle(service)}
                    aria-labelledby={`${checkboxId}-label`}
                  />
                  <div className="flex-1" id={`${checkboxId}-label`}>
                    <h4 className="font-semibold text-gray-900">{service.name}</h4>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {formData.services.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-900">Appointment Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Duration:</span>
                <span className="font-semibold text-gray-900">{totalDuration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Price:</span>
                <span className="font-semibold text-gray-900">${totalPrice}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 md:gap-4 pt-6">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 min-h-touch-lg active-scale"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 min-h-touch-lg active-scale"
            disabled={formData.services.length === 0 || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Appointment
          </Button>
        </div>
      </form>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={open => !open && onClose()} modal={false}>
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
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[85vh] w-full max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Update customer details, services, and scheduled time for this appointment.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

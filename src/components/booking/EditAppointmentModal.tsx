'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Appointment, Service, ServiceCategory, Stylist } from '@/types';
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
import { formatTime12Hour, getMinDateForInput } from '@/lib/timeUtils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Loader2 } from 'lucide-react';
import { useAvailability } from '@/hooks/queries/useAvailability';
import { useStylists } from '@/hooks/queries/useStylists';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSave: (updatedAppointment: Partial<Appointment>) => Promise<void>;
}

type BookingMode = 'category' | 'service';

interface FormData {
  customerName: string;
  customerEmail: string;
  date: string;
  time: string;
  stylistId: string | null;
  // Category-based
  categoryId: string | null;
  estimatedDuration: number;
  // Service-based
  services: Service[];
}

export default function EditAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onSave,
}: EditAppointmentModalProps) {
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    date: '',
    time: '',
    stylistId: null,
    categoryId: null,
    estimatedDuration: 0,
    services: [],
  });
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingMode, setBookingMode] = useState<BookingMode>('service');

  // Determine duration for availability check
  const totalDuration = useMemo(() => {
    if (bookingMode === 'category') {
      return formData.estimatedDuration || 60; // Default 60 min for category
    }
    return formData.services.reduce((sum, service) => sum + service.duration, 0);
  }, [bookingMode, formData.estimatedDuration, formData.services]);

  // Fetch stylists
  const { data: stylists = [], isLoading: stylistsLoading } = useStylists({
    enabled: isOpen,
  });

  // Fetch availability based on date, stylist, and duration
  const { data: availableSlots = [], isLoading: slotsLoading } = useAvailability({
    date: formData.date ? new Date(formData.date) : new Date(),
    stylistId: formData.stylistId || undefined,
    duration: totalDuration,
    enabled: isOpen && !!formData.date,
  });

  // Fetch categories and services
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const response = await fetch('/api/services');
        const data = (await response.json()) as ServiceCategory[];
        setCategories(data);
        // Flatten categories to get all services
        const allServices = data.flatMap((category: ServiceCategory) => category.items || []);
        setAvailableServices(allServices);
      } catch (err) {
        console.error('Failed to fetch services:', err);
      }
    };
    fetchData();
  }, [isOpen]);

  // Initialize form when appointment changes
  useEffect(() => {
    if (appointment) {
      const isCategoryBased = !!appointment.categoryId;
      setBookingMode(isCategoryBased ? 'category' : 'service');

      setFormData({
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        date: format(new Date(appointment.date), 'yyyy-MM-dd'),
        time: appointment.time,
        stylistId: appointment.stylistId || null,
        categoryId: appointment.categoryId || null,
        estimatedDuration: appointment.estimatedDuration || 0,
        services: isCategoryBased ? [] : appointment.services,
      });
    }
  }, [appointment]);

  // Reset time when date or stylist changes (availability may differ)
  useEffect(() => {
    // Only reset if the current time is not in available slots
    if (formData.time && availableSlots.length > 0 && !availableSlots.includes(formData.time)) {
      setFormData(prev => ({ ...prev, time: '' }));
    }
  }, [formData.date, formData.stylistId, availableSlots, formData.time]);

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

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setFormData(prev => ({
      ...prev,
      categoryId,
      estimatedDuration: category?.estimatedDuration || 60,
    }));
  };

  const calculateTotals = () => {
    if (bookingMode === 'category') {
      return {
        totalPrice: 0, // Price determined at appointment
        totalDuration: formData.estimatedDuration,
      };
    }
    const totalPrice = formData.services.reduce((sum, service) => sum + service.basePrice, 0);
    const totalDuration = formData.services.reduce((sum, service) => sum + service.duration, 0);
    return { totalPrice, totalDuration };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.date || !formData.time) {
      const errorMsg = 'Please select a date and time';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (bookingMode === 'service' && formData.services.length === 0) {
      const errorMsg = 'Please select at least one service';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (bookingMode === 'category' && !formData.categoryId) {
      const errorMsg = 'Please select a service category';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Updating appointment...');

    try {
      const { totalPrice, totalDuration } = calculateTotals();

      const updateData: Partial<Appointment> = {
        date: new Date(formData.date),
        time: formData.time,
        stylistId: formData.stylistId,
        totalDuration,
      };

      if (bookingMode === 'category') {
        updateData.categoryId = formData.categoryId!;
        updateData.estimatedDuration = formData.estimatedDuration;
        updateData.services = [];
        updateData.totalPrice = 0;
      } else {
        updateData.services = formData.services;
        updateData.totalPrice = totalPrice;
        updateData.categoryId = undefined;
        updateData.estimatedDuration = undefined;
      }

      await onSave(updateData);
      toast.success('Appointment updated successfully!', { id: toastId });
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update appointment';
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { totalPrice, totalDuration: summaryDuration } = calculateTotals();
  const isMobile = useIsMobile();

  // Group services by category for better organization
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, { category: ServiceCategory; services: Service[] }> = {};
    categories.forEach(category => {
      if (category.items && category.items.length > 0) {
        grouped[category.id] = {
          category,
          services: category.items,
        };
      }
    });
    return grouped;
  }, [categories]);

  const selectedCategory = categories.find(c => c.id === formData.categoryId);

  const content = (
    <div className="space-y-6 p-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Details Section (Read-only) */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Customer Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="customerName" className="text-muted-foreground">
                Account
              </Label>
              <Input
                id="customerName"
                type="text"
                value={formData.customerName}
                disabled
                className="mt-1 bg-muted cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Stylist Section */}
        <section className="space-y-2">
          <Label htmlFor="stylist">Stylist</Label>
          <Select
            value={formData.stylistId || 'none'}
            onValueChange={value =>
              setFormData(prev => ({ ...prev, stylistId: value === 'none' ? null : value }))
            }
            disabled={stylistsLoading}
          >
            <SelectTrigger id="stylist" className="min-h-touch-lg">
              <SelectValue placeholder={stylistsLoading ? 'Loading...' : 'No preference'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No preference</SelectItem>
              {stylists.map((stylist: Stylist) => (
                <SelectItem key={stylist.id} value={stylist.id}>
                  {stylist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <Separator />

        {/* Date & Time Section */}
        <section className="space-y-4">
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, date: e.target.value, time: '' }))
              }
              min={getMinDateForInput()}
              className="mt-1 min-h-touch-lg"
              required
            />
          </div>

          <div>
            <Label>Available Times *</Label>
            {slotsLoading ? (
              <div className="py-6 text-center">
                <LoadingSpinner size="sm" message="Loading times..." />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-gray-500">
                  {formData.date ? 'No available times for this date' : 'Select a date first'}
                </p>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {availableSlots.map(slot => {
                  const isSelected = formData.time === slot;
                  return (
                    <Button
                      key={slot}
                      type="button"
                      variant={isSelected ? 'default' : 'secondary'}
                      className={cn(
                        'min-h-touch-lg h-auto px-2 py-2 text-sm font-medium',
                        isSelected && 'ring-2 ring-primary ring-offset-2',
                      )}
                      onClick={() => setFormData(prev => ({ ...prev, time: slot }))}
                    >
                      {formatTime12Hour(slot)}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Summary */}
        {(formData.services.length > 0 || (bookingMode === 'category' && formData.categoryId)) && (
          <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Appointment Summary</h3>
            <dl className="space-y-2 text-sm">
              {formData.stylistId && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Stylist</dt>
                  <dd className="font-medium text-gray-900">
                    {stylists.find(s => s.id === formData.stylistId)?.name || 'Unknown'}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-600">Duration</dt>
                <dd className="font-medium text-gray-900">{summaryDuration} minutes</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Date & Time</dt>
                <dd className="font-medium text-gray-900">
                  {formData.date} {formatTime12Hour(formData.time)}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 min-h-touch-lg"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 min-h-touch-lg"
            disabled={
              isSubmitting ||
              !formData.time ||
              (bookingMode === 'service' && formData.services.length === 0) ||
              (bookingMode === 'category' && !formData.categoryId)
            }
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Appointment
          </Button>
        </div>
      </form>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={open => !open && onClose()} modal={false}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b border-gray-200">
            <DrawerTitle>Edit Appointment</DrawerTitle>
            <DrawerDescription>
              Update appointment details, services, and scheduled time.
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Update appointment details, services, and scheduled time.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

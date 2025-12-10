'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
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

import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Loader2 } from 'lucide-react';
import { useStylists } from '@/hooks/queries/useStylists';
import { DateTimePicker } from './step3-datetime';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { BookingConfirmationSummary } from './step4-confirmation/BookingConfirmationSummary';

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
  const t = useTranslations('EditAppointmentModal');
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
      const errorMsg = t('selectDateAndTime');
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (bookingMode === 'service' && formData.services.length === 0) {
      const errorMsg = t('selectService');
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (bookingMode === 'category' && !formData.categoryId) {
      const errorMsg = t('selectCategory');
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(t('updating'));

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
      toast.success(t('updateSuccess'), { id: toastId });
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('updateFailed');
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
          <h3 className="text-sm font-semibold text-gray-900">{t('customerDetails')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="customerName" className="text-muted-foreground">
                {t('account')}
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
          <Label htmlFor="stylist">{t('stylist')}</Label>
          <Select
            value={formData.stylistId || 'none'}
            onValueChange={value =>
              setFormData(prev => ({ ...prev, stylistId: value === 'none' ? null : value }))
            }
            disabled={stylistsLoading}
          >
            <SelectTrigger id="stylist" className="min-h-touch-lg">
              <SelectValue placeholder={stylistsLoading ? t('loading') : t('noPreference')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('noPreference')}</SelectItem>
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
          <DateTimePicker
            selectedDate={formData.date ? new Date(formData.date) : new Date()}
            onDateChange={date =>
              setFormData(prev => ({
                ...prev,
                date: format(date, 'yyyy-MM-dd'),
                time: '',
              }))
            }
            selectedTime={formData.time || null}
            onTimeSelect={time => setFormData(prev => ({ ...prev, time: time || '' }))}
            totalDuration={totalDuration}
            selectedStylist={stylists.find(s => s.id === formData.stylistId) || null}
          />
        </section>

        {/* Summary */}
        {formData.date && formData.time && (
          <BookingConfirmationSummary
            selectedCategory={categories.find(c => c.id === formData.categoryId) || null}
            selectedStylist={stylists.find(s => s.id === formData.stylistId) || null}
            selectedDate={new Date(formData.date)}
            selectedTime={formData.time}
            totalDuration={summaryDuration}
          />
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
            {t('cancel')}
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
            {t('updateAppointment')}
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
            <DrawerTitle>{t('title')}</DrawerTitle>
            <DrawerDescription>{t('description')}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[85vh] w-full max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

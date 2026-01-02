'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Appointment, Stylist } from '@/types';
import { cn } from '@/lib/utils';

type ViewType = 'day' | 'week' | 'month';

interface CalendarGridViewProps {
  appointments: Appointment[];
  stylists: Stylist[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  startHour?: number;
  endHour?: number;
  defaultView?: ViewType;
}

// Height per 30-minute slot in pixels
const SLOT_HEIGHT = 40;

/**
 * Calendar Grid View for appointments - displays appointments in a schedule grid
 * with Day, Week, and Month view options.
 */
export default function CalendarGridView({
  appointments,
  stylists,
  selectedDate,
  onDateChange,
  onAppointmentClick,
  startHour = 9,
  endHour = 20,
  defaultView = 'day',
}: CalendarGridViewProps) {
  const t = useTranslations('Admin.Appointments');
  const format = useFormatter();
  const [viewType, setViewType] = useState<ViewType>(defaultView);

  // Generate time slots (30-minute intervals)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, [startHour, endHour]);

  // Get week days for week view
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const startOfWeek = new Date(selectedDate);
    const dayOfWeek = startOfWeek.getDay();
    // Start from Monday (adjust for Sunday = 0)
    startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [selectedDate]);

  // Get month days for month view
  const monthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];
    // Add empty slots for days before the first day
    const startDayOfWeek = firstDay.getDay();
    const emptyDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    for (let i = 0; i < emptyDays; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [selectedDate]);

  // Filter appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === dateStr;
    });
  };

  // Navigation handlers
  const goToToday = () => onDateChange(new Date());

  const goToPrevious = () => {
    const prev = new Date(selectedDate);
    if (viewType === 'day') {
      prev.setDate(prev.getDate() - 1);
    } else if (viewType === 'week') {
      prev.setDate(prev.getDate() - 7);
    } else {
      prev.setMonth(prev.getMonth() - 1);
    }
    onDateChange(prev);
  };

  const goToNext = () => {
    const next = new Date(selectedDate);
    if (viewType === 'day') {
      next.setDate(next.getDate() + 1);
    } else if (viewType === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    onDateChange(next);
  };

  // Format time for display
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format.dateTime(date, { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Get header title based on view type
  const getHeaderTitle = () => {
    if (viewType === 'day') {
      return format.dateTime(selectedDate, {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } else if (viewType === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${format.dateTime(start, { month: 'short', day: 'numeric' })} - ${format.dateTime(end, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return format.dateTime(selectedDate, { month: 'long', year: 'numeric' });
    }
  };

  // Calculate appointment block position and height
  const getAppointmentStyle = (apt: Appointment) => {
    const [hours, minutes] = apt.time.split(':').map(Number);
    const startMinutes = (hours - startHour) * 60 + minutes;
    const duration = apt.totalDuration || apt.estimatedDuration || 60;
    const top = (startMinutes / 30) * SLOT_HEIGHT;
    const height = (duration / 30) * SLOT_HEIGHT;
    return {
      top: `${top}px`,
      height: `${Math.max(height, SLOT_HEIGHT)}px`,
    };
  };

  // Appointment block component
  const AppointmentBlock = ({ apt, compact = false }: { apt: Appointment; compact?: boolean }) => (
    <div
      className={cn(
        'rounded-md px-1.5 py-0.5 cursor-pointer overflow-hidden',
        'bg-emerald-100 border border-emerald-300 hover:bg-emerald-200 transition-colors',
        compact ? 'text-[10px]' : 'text-xs',
      )}
      onClick={() => onAppointmentClick?.(apt)}
    >
      <div className="font-medium text-emerald-900 truncate">
        {compact
          ? apt.customerName
          : `${formatTimeDisplay(apt.time)} - ${apt.category?.title || 'Appointment'}`}
      </div>
      {!compact && (
        <div className="flex items-center gap-1 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="truncate">{apt.customerName}</span>
        </div>
      )}
    </div>
  );

  // Render Day View (stylists as columns)
  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(selectedDate);
    const appointmentsByStylist = new Map<string, Appointment[]>();
    stylists.forEach(s => appointmentsByStylist.set(s.id, []));
    dayAppointments.forEach(apt => {
      if (apt.stylistId) {
        const existing = appointmentsByStylist.get(apt.stylistId) || [];
        existing.push(apt);
        appointmentsByStylist.set(apt.stylistId, existing);
      }
    });

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Header row */}
          <div className="flex border-b border-border bg-gray-50 sticky top-0 z-10">
            <div className="w-16 flex-shrink-0 p-2 border-r border-border" />
            {stylists.length > 0 ? (
              stylists.map(stylist => (
                <div
                  key={stylist.id}
                  className="flex-1 min-w-[140px] p-2 text-center border-r border-border last:border-r-0"
                >
                  <div className="font-medium text-sm truncate">{stylist.name}</div>
                </div>
              ))
            ) : (
              <div className="flex-1 p-2 text-center text-muted-foreground">
                {t('noStylistsAvailable')}
              </div>
            )}
          </div>

          {/* Time grid */}
          <div className="relative flex">
            <div className="w-16 flex-shrink-0 border-r border-border bg-gray-50/50">
              {timeSlots.map((slot, index) => (
                <div
                  key={slot}
                  className={cn(
                    'px-1 flex items-start justify-end text-[10px] text-muted-foreground',
                    index % 2 === 0 && 'border-t border-border',
                  )}
                  style={{ height: SLOT_HEIGHT }}
                >
                  {index % 2 === 0 && <span className="-mt-1.5">{formatTimeDisplay(slot)}</span>}
                </div>
              ))}
            </div>

            {stylists.length > 0 ? (
              stylists.map(stylist => (
                <div
                  key={stylist.id}
                  className="flex-1 min-w-[140px] relative border-r border-border last:border-r-0"
                >
                  {timeSlots.map((slot, index) => (
                    <div
                      key={slot}
                      className={cn(
                        '',
                        index % 2 === 0
                          ? 'border-t border-border'
                          : 'border-t border-dashed border-gray-100',
                      )}
                      style={{ height: SLOT_HEIGHT }}
                    />
                  ))}
                  <div className="absolute inset-0 p-0.5">
                    {appointmentsByStylist.get(stylist.id)?.map(apt => (
                      <div
                        key={apt.id}
                        className="absolute left-0.5 right-0.5"
                        style={getAppointmentStyle(apt)}
                      >
                        <AppointmentBlock apt={apt} />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 min-w-[140px]">
                {timeSlots.map((slot, index) => (
                  <div
                    key={slot}
                    className={cn(
                      '',
                      index % 2 === 0
                        ? 'border-t border-border'
                        : 'border-t border-dashed border-gray-100',
                    )}
                    style={{ height: SLOT_HEIGHT }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Week View (days as columns)
  const renderWeekView = () => {
    const today = new Date().toDateString();

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Week header */}
          <div className="flex border-b border-border bg-gray-50 sticky top-0 z-10">
            <div className="w-16 flex-shrink-0 p-2 border-r border-border" />
            {weekDays.map(day => {
              const isToday = day.toDateString() === today;
              const isSelected = day.toDateString() === selectedDate.toDateString();
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'flex-1 min-w-[90px] p-2 text-center border-r border-border last:border-r-0 cursor-pointer hover:bg-gray-100',
                    isToday && 'bg-blue-50',
                    isSelected && 'bg-primary/10',
                  )}
                  onClick={() => {
                    onDateChange(day);
                    setViewType('day');
                  }}
                >
                  <div className="text-xs text-muted-foreground">
                    {format.dateTime(day, { weekday: 'short' })}
                  </div>
                  <div className={cn('text-lg font-bold', isToday && 'text-blue-600')}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="relative flex">
            <div className="w-16 flex-shrink-0 border-r border-border bg-gray-50/50">
              {timeSlots.map((slot, index) => (
                <div
                  key={slot}
                  className={cn(
                    'px-1 flex items-start justify-end text-[10px] text-muted-foreground',
                    index % 2 === 0 && 'border-t border-border',
                  )}
                  style={{ height: SLOT_HEIGHT }}
                >
                  {index % 2 === 0 && <span className="-mt-1.5">{formatTimeDisplay(slot)}</span>}
                </div>
              ))}
            </div>

            {weekDays.map(day => {
              const dayApts = getAppointmentsForDate(day);
              const isToday = day.toDateString() === today;
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'flex-1 min-w-[90px] relative border-r border-border last:border-r-0',
                    isToday && 'bg-blue-50/30',
                  )}
                >
                  {timeSlots.map((slot, index) => (
                    <div
                      key={slot}
                      className={cn(
                        '',
                        index % 2 === 0
                          ? 'border-t border-border'
                          : 'border-t border-dashed border-gray-100',
                      )}
                      style={{ height: SLOT_HEIGHT }}
                    />
                  ))}
                  <div className="absolute inset-0 p-0.5">
                    {dayApts.map(apt => (
                      <div
                        key={apt.id}
                        className="absolute left-0.5 right-0.5"
                        style={getAppointmentStyle(apt)}
                      >
                        <AppointmentBlock apt={apt} compact />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render Month View (calendar grid)
  const renderMonthView = () => {
    const today = new Date().toDateString();
    const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="overflow-auto">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-gray-50">
          {weekdayNames.map(day => (
            <div
              key={day}
              className="p-2 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7">
          {monthDays.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[100px] border-r border-b border-border bg-gray-50/50"
                />
              );
            }

            const dayApts = getAppointmentsForDate(day);
            const isToday = day.toDateString() === today;
            const isSelected = day.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[100px] p-1 border-r border-b border-border cursor-pointer hover:bg-gray-50 transition-colors',
                  isToday && 'bg-blue-50',
                  isSelected && 'ring-2 ring-primary ring-inset',
                )}
                onClick={() => {
                  onDateChange(day);
                  setViewType('day');
                }}
              >
                <div
                  className={cn(
                    'text-sm font-medium mb-1',
                    isToday ? 'text-blue-600' : 'text-foreground',
                  )}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayApts.slice(0, 3).map(apt => (
                    <div
                      key={apt.id}
                      className="text-[10px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 truncate"
                      onClick={e => {
                        e.stopPropagation();
                        onAppointmentClick?.(apt);
                      }}
                    >
                      {apt.time.slice(0, 5)} {apt.customerName}
                    </div>
                  ))}
                  {dayApts.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{dayApts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      {/* Header with navigation and view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-border bg-gray-50">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            {t('today')}
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="font-semibold text-sm sm:text-base">{getHeaderTitle()}</span>
        </div>

        {/* View type toggle */}
        <div className="flex border border-border rounded-md overflow-hidden">
          {(['day', 'week', 'month'] as ViewType[]).map(view => (
            <Button
              key={view}
              variant={viewType === view ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none px-3 h-8 capitalize"
              onClick={() => setViewType(view)}
            >
              {view}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar content */}
      <div className="max-h-[600px] overflow-auto">
        {viewType === 'day' && renderDayView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'month' && renderMonthView()}
      </div>
    </div>
  );
}

'use client';

import { useFormatter } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Earth, MoveRight } from 'lucide-react';
import TelegramIcon from '@/components/icons/telegram';
import WhatsappIcon from '@/components/icons/whatsapp';
import type { Appointment } from '@/types';
import { cn } from '@/lib/utils';
import React from 'react';

interface AppointmentCardProps {
  appointment: Appointment;
  layout?: 'card' | 'row';
  showPrice?: boolean;
  showSource?: boolean;
  showStylist?: boolean; // New prop to show stylist name
  hideCustomer?: boolean; // New prop to hide customer name (for customer dashboard)
  actions?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function AppointmentCard({
  appointment,
  layout = 'card',
  showPrice = false,
  showSource = false,
  showStylist = false,
  hideCustomer = false,
  actions,
  className,
  onClick,
}: AppointmentCardProps) {
  const format = useFormatter();

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format.dateTime(dateObj, { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (time: string, duration: number) => {
    const [hours, minutes] = time.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes);

    const endDate = new Date(startDate.getTime() + duration * 60000);

    const formatTimeStr = (date: Date, showAmPm = true) =>
      format
        .dateTime(date, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
        .replace(/\s*(AM|PM|am|pm)\s*$/i, showAmPm ? '$&' : '');

    return (
      <div className="flex items-center gap-1">
        {formatTimeStr(startDate, false)} <MoveRight className="w-3.5 h-3.5" />{' '}
        {formatTimeStr(endDate, true)}
      </div>
    );
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'TELEGRAM':
        return (
          <>
            <TelegramIcon width={14} height={14} />
            Telegram
          </>
        );
      case 'WHATSAPP':
        return (
          <>
            <WhatsappIcon width={14} height={14} />
            WhatsApp
          </>
        );
      case 'WEB':
      default:
        return (
          <>
            <Earth className="w-3.5 h-3.5" />
            Web
          </>
        );
    }
  };

  if (layout === 'row') {
    return (
      <div className={cn('p-4 hover:bg-muted/50 transition-colors', className)} onClick={onClick}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-medium mb-0.5">{appointment.category?.title || 'Service'}</p>
            <div className="flex items-center gap-0.5 text-sm text-muted-foreground">
              {!hideCustomer && (
                <>
                  with{' '}
                  <span className="font-medium text-foreground">{appointment.customerName}</span>
                </>
              )}
              {showStylist && appointment.stylist?.name && (
                <>
                  {!hideCustomer && <span className="mx-1">·</span>}
                  Stylist:{' '}
                  <span className="font-medium text-foreground">{appointment.stylist.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatDate(appointment.date)}</p>
            <p className="text-sm text-muted-foreground">
              {formatTime(appointment.time, appointment.totalDuration)}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {showSource && (
              <Badge variant="outline" className="gap-1 text-xs font-normal">
                Booked with {getSourceIcon(appointment.bookingSource)}
              </Badge>
            )}
            {showPrice && (
              <Badge variant="secondary" className="font-normal">
                ${appointment.totalPrice}
              </Badge>
            )}
          </div>
          {actions && <div className="ml-auto">{actions}</div>}
        </div>
      </div>
    );
  }

  // Card Layout (Default for Stylist Dashboard)
  return (
    <div
      className={cn(
        'border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors bg-card text-card-foreground shadow-sm',
        className,
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-foreground">{formatDate(appointment.date)}</p>
          <p className="text-sm text-muted-foreground">
            {formatTime(appointment.time, appointment.totalDuration)}
          </p>
        </div>
        {(showPrice || appointment.totalPrice > 0) && (
          <Badge variant="outline" className="text-sm">
            ${appointment.totalPrice}
          </Badge>
        )}
      </div>

      <div className="flex justify-between items-end">
        <div className="text-sm space-y-1">
          {!hideCustomer && (
            <p className="font-medium text-foreground">{appointment.customerName}</p>
          )}
          <p className="text-muted-foreground">
            {appointment.category?.title ||
              appointment.services.map(s => s.name).join(', ') ||
              'Service'}
          </p>
          {showStylist && appointment.stylist && (
            <p className="text-sm text-muted-foreground">
              Stylist:{' '}
              <span className="font-medium text-foreground">{appointment.stylist.name}</span>
            </p>
          )}
          {showSource && (
            <div className="pt-1">
              <Badge variant="secondary" className="gap-1 text-xs font-normal">
                {getSourceIcon(appointment.bookingSource)}
              </Badge>
            </div>
          )}
        </div>

        {actions && <div>{actions}</div>}
      </div>
    </div>
  );
}

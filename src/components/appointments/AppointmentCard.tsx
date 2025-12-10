'use client';

import { useFormatter } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Earth } from 'lucide-react';
import TelegramIcon from '@/components/icons/telegram';
import WhatsappIcon from '@/components/icons/whatsapp';
import type { Appointment } from '@/types';
import { cn } from '@/lib/utils';
import React from 'react';
import { formatDuration } from '@/lib/timeUtils';

interface AppointmentCardProps {
  appointment: Appointment;
  showSource?: boolean;
  showStylist?: boolean;
  hideCustomer?: boolean;
  actions?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function AppointmentCard({
  appointment,
  showSource = false,
  showStylist = false,
  hideCustomer = false,
  actions,
  className,
  onClick,
}: AppointmentCardProps) {
  const format = useFormatter();

  // Format time as single string (e.g., "2:30 PM")
  const formatTimeSimple = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format.dateTime(date, { hour: 'numeric', minute: '2-digit', hour12: true });
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

  return (
    <div
      className={cn(
        'p-4 flex items-center justify-between hover:bg-muted/50 transition-colors',
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-5">
        <div className="min-w-[70px]">
          <div className="text-lg font-semibold text-foreground">
            {formatTimeSimple(appointment.time)}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDuration(appointment.totalDuration)}
          </div>
        </div>
        <div>
          <p className="font-medium text-foreground">{appointment?.category?.title}</p>
          <p className="text-sm text-muted-foreground">
            {!hideCustomer && appointment.customerName}
            {!hideCustomer && showStylist && appointment?.stylist?.name && ' with '}
            {showStylist && appointment?.stylist?.name}
          </p>

          <div className="flex items-center gap-2 mt-1">
            {showSource && (
              <Badge variant="outline" className="gap-1 text-xs font-normal">
                Booked with {getSourceIcon(appointment.bookingSource)}
              </Badge>
            )}
          </div>
        </div>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}

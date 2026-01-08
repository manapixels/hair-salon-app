'use client';

import { useFormatter, useTranslations, useLocale } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Earth } from 'lucide-react';
import TelegramIcon from '@/components/icons/telegram';
import WhatsappIcon from '@/components/icons/whatsapp';
import type { Appointment } from '@/types';
import { cn } from '@/lib/utils';
import React from 'react';
import Link from 'next/link';

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
  const t = useTranslations('AppointmentCard');
  const tNav = useTranslations('Navigation');
  const tCommon = useTranslations('Common');
  const locale = useLocale();

  // Format time as single string (e.g., "2:30 PM" or "14:30")
  const formatTimeSimple = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format.dateTime(date, { hour: 'numeric', minute: '2-digit' });
  };

  // Format duration with i18n (e.g., "2h" or "2小时")
  const formatDurationI18n = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return tCommon('duration.minutesShort', { minutes: mins });
    if (mins === 0) return tCommon('duration.hoursShort', { hours });
    return tCommon('duration.hoursMinutesShort', { hours, minutes: mins });
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'TELEGRAM':
        return (
          <>
            <TelegramIcon width={14} height={14} />
            {t('telegram')}
          </>
        );
      case 'WHATSAPP':
        return (
          <>
            <WhatsappIcon width={14} height={14} />
            {t('whatsapp')}
          </>
        );
      case 'WEB':
      default:
        return (
          <>
            <Earth className="w-3.5 h-3.5" />
            {t('web')}
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
            {formatDurationI18n(appointment.totalDuration)}
          </div>
        </div>
        <div>
          <p className="font-medium text-foreground">
            {appointment?.category?.slug
              ? tNav(`serviceNames.${appointment.category.slug}` as any) ||
                appointment?.category?.title
              : appointment?.category?.title}
          </p>
          <p className="text-sm text-muted-foreground flex items-center flex-wrap gap-x-1">
            {!hideCustomer && (
              <>
                <span className="text-muted-foreground/70">{t('customer')}:</span>
                <Link
                  href={`/${locale}/admin/customers?search=${encodeURIComponent(appointment.customerName)}`}
                  className="text-primary hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  {appointment.customerName}
                </Link>
              </>
            )}
            {!hideCustomer && showStylist && appointment?.stylist?.name && (
              <span className="text-muted-foreground/50">|</span>
            )}
            {showStylist && appointment?.stylist && (
              <>
                <span className="text-muted-foreground/70">{t('stylist')}:</span>
                <Link
                  href={`/${locale}/admin/stylists?id=${appointment.stylist.id}`}
                  className="text-primary hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  {appointment.stylist.name}
                </Link>
              </>
            )}
          </p>

          <div className="flex items-center gap-2 mt-1">
            {showSource && (
              <Badge variant="outline" className="gap-1 text-xs font-normal">
                {t('bookedWith')} {getSourceIcon(appointment.bookingSource)}
              </Badge>
            )}
          </div>
        </div>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}

'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MoreHorizontal, TrendingUp, User } from 'lucide-react';
import TelegramIcon from '@/components/icons/telegram';
import WhatsappIcon from '@/components/icons/whatsapp';
import { cn } from '@/lib/utils';
import type { CustomerWithStats, CustomerStatus } from '@/types';

interface CustomerCardProps {
  customer: CustomerWithStats;
  onViewDetails?: (customer: CustomerWithStats) => void;
  onBookAppointment?: (customer: CustomerWithStats) => void;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getStatusBadgeVariant(
  status: CustomerStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'NEW':
      return 'default';
    case 'ACTIVE':
      return 'secondary';
    case 'AT_RISK':
      return 'outline';
    case 'CHURNED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export default function CustomerCard({
  customer,
  onViewDetails,
  onBookAppointment,
  className,
}: CustomerCardProps) {
  const format = useFormatter();
  const t = useTranslations('Admin.Customers');

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format.dateTime(dateObj, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatRelativeDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7) return t('daysAgo', { days: diffDays });
    if (diffDays < 30) return t('weeksAgo', { weeks: Math.floor(diffDays / 7) });
    return formatDate(date);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format.dateTime(date, { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getContactMethodIcon = () => {
    if (customer.authProvider === 'telegram' || customer.telegramId) {
      return (
        <Badge variant="outline" className="gap-1 text-xs font-normal">
          <TelegramIcon width={12} height={12} />
          Telegram
        </Badge>
      );
    }
    if (customer.authProvider === 'whatsapp' || customer.whatsappPhone) {
      return (
        <Badge variant="outline" className="gap-1 text-xs font-normal">
          <WhatsappIcon width={12} height={12} />
          WhatsApp
        </Badge>
      );
    }
    return null;
  };

  const statusLabel = {
    NEW: t('statusNew'),
    ACTIVE: t('statusActive'),
    AT_RISK: t('statusAtRisk'),
    CHURNED: t('statusChurned'),
  };

  return (
    <Card className={cn('p-4 hover:shadow-md transition-shadow', className)}>
      {/* Header: Customer identity + Actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={customer.avatar} alt={customer.name} />
            <AvatarFallback className="text-sm">{getInitials(customer.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-base">{customer.name}</p>
            <p className="text-xs text-muted-foreground">{customer.email}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t('openMenu')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails?.(customer)}>
              {t('viewDetails')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBookAppointment?.(customer)}>
              {t('bookAppointment')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Next Appointment Section */}
      {customer.nextAppointment ? (
        <div className="bg-muted/50 rounded-lg p-3 mb-3">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-medium text-muted-foreground">{t('nextVisit')}</p>
            <Badge variant={getStatusBadgeVariant(customer.status)} className="text-xs">
              {statusLabel[customer.status]}
            </Badge>
          </div>
          <p className="font-medium text-sm mb-1">
            {customer.nextAppointment.categoryTitle || t('appointment')}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(customer.nextAppointment.date)}</span>
            <span>-</span>
            <Clock className="w-3 h-3" />
            <span>{formatTime(customer.nextAppointment.time)}</span>
          </div>
          {customer.nextAppointment.stylistName && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('with')}{' '}
              <span className="font-medium text-foreground">
                {customer.nextAppointment.stylistName}
              </span>
            </p>
          )}
        </div>
      ) : (
        <div className="bg-muted/30 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t('noUpcomingAppointment')}</p>
            <Badge variant={getStatusBadgeVariant(customer.status)} className="text-xs">
              {statusLabel[customer.status]}
            </Badge>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Badge variant="secondary" className="gap-1">
          <TrendingUp className="w-3 h-3" />
          {t('visits', { count: customer.totalVisits })}
        </Badge>
        {customer.lastVisitDate && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="w-3 h-3" />
            {t('lastVisit')}: {formatRelativeDate(customer.lastVisitDate)}
          </Badge>
        )}
      </div>

      {/* Preferred Stylist */}
      {customer.preferredStylist && (
        <div className="flex items-center gap-2 text-sm mb-2">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{t('preferred')}:</span>
          <span className="font-medium">{customer.preferredStylist.name}</span>
        </div>
      )}

      {/* Contact Method Badge */}
      <div className="flex items-center gap-2 mt-2">{getContactMethodIcon()}</div>
    </Card>
  );
}

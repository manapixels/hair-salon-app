'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Earth, MoreHorizontal, Calendar, Clock, User, MessageSquare } from 'lucide-react';
import TelegramIcon from '@/components/icons/telegram';
import WhatsappIcon from '@/components/icons/whatsapp';
import type { CustomerWithStats, CustomerStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useFormatter, useTranslations } from 'next-intl';

interface CustomerCardProps {
  customer: CustomerWithStats;
  onBookAppointment?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export default function CustomerCard({
  customer,
  onBookAppointment,
  onViewDetails,
  className,
}: CustomerCardProps) {
  const format = useFormatter();
  const t = useTranslations('Admin.Customers');

  const formatRelativeDate = (date: Date | string | undefined) => {
    if (!date) return t('never');
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format.relativeTime(dateObj);
  };

  const formatAppointmentDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format.dateTime(dateObj, { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getStatusBadgeVariant = (status: CustomerStatus) => {
    switch (status) {
      case 'NEW':
        return 'outline';
      case 'ACTIVE':
        return 'default';
      case 'AT_RISK':
        return 'secondary';
      case 'CHURNED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: CustomerStatus) => {
    return t(`status.${status.toLowerCase()}`);
  };

  const getContactIcon = () => {
    if (customer.telegramId) {
      return <TelegramIcon width={14} height={14} />;
    }
    if (customer.whatsappPhone) {
      return <WhatsappIcon width={14} height={14} />;
    }
    return <Earth className="w-3.5 h-3.5" />;
  };

  const getContactLabel = () => {
    if (customer.telegramId) return 'Telegram';
    if (customer.whatsappPhone) return 'WhatsApp';
    return 'Email';
  };

  const initials = customer.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors',
        className,
      )}
    >
      {/* Header: Avatar, Name, Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={customer.avatar} alt={customer.name} />
            <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{customer.name}</p>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(customer.status)} className="text-xs">
            {getStatusLabel(customer.status)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <User className="w-4 h-4 mr-2" />
                {t('viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBookAppointment}>
                <Calendar className="w-4 h-4 mr-2" />
                {t('bookAppointment')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="w-4 h-4 mr-2" />
                {t('contact')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Next Appointment - Highlighted */}
      {customer.nextAppointment ? (
        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 mb-3">
          <p className="text-xs font-medium text-primary mb-1">{t('nextAppointment')}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">
                {formatAppointmentDate(customer.nextAppointment.date)}
              </p>
              <p className="text-xs text-muted-foreground">
                {customer.nextAppointment.time} ·{' '}
                {customer.nextAppointment.categoryTitle || t('service')}
              </p>
            </div>
            {customer.nextAppointment.stylistName && (
              <Badge variant="outline" className="text-xs">
                {customer.nextAppointment.stylistName}
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-md p-3 mb-3 text-center">
          <p className="text-sm text-muted-foreground">{t('noUpcomingAppointment')}</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center justify-between text-sm border-t border-border pt-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{customer.totalVisits}</span>
            <span className="text-muted-foreground">{t('visits')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatRelativeDate(customer.lastVisitDate)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {customer.preferredStylist && (
            <Badge variant="secondary" className="text-xs font-normal">
              <User className="w-3 h-3 mr-1" />
              {customer.preferredStylist.name}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs font-normal gap-1">
            {getContactIcon()}
            {getContactLabel()}
          </Badge>
        </div>
      </div>
    </div>
  );
}

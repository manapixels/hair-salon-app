'use client';

import { useFormatter, useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import TelegramIcon from '@/components/icons/telegram';
import WhatsappIcon from '@/components/icons/whatsapp';
import type { CustomerWithStats, CustomerStatus } from '@/types';

interface CustomerTableProps {
  customers: CustomerWithStats[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  onViewDetails?: (customer: CustomerWithStats) => void;
  onBookAppointment?: (customer: CustomerWithStats) => void;
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

export default function CustomerTable({
  customers,
  sortBy,
  sortOrder,
  onSort,
  onViewDetails,
  onBookAppointment,
}: CustomerTableProps) {
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

  const getContactMethodIcon = (customer: CustomerWithStats) => {
    if (customer.authProvider === 'telegram' || customer.telegramId) {
      return (
        <div className="flex items-center gap-1">
          <TelegramIcon width={14} height={14} />
          <span className="text-xs">Telegram</span>
        </div>
      );
    }
    if (customer.authProvider === 'whatsapp' || customer.whatsappPhone) {
      return (
        <div className="flex items-center gap-1">
          <WhatsappIcon width={14} height={14} />
          <span className="text-xs">WhatsApp</span>
        </div>
      );
    }
    return <span className="text-xs text-muted-foreground">-</span>;
  };

  const statusLabel = {
    NEW: t('statusNew'),
    ACTIVE: t('statusActive'),
    AT_RISK: t('statusAtRisk'),
    CHURNED: t('statusChurned'),
  };

  const SortButton = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => onSort(column)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <div className="bg-white border border-border rounded-lg">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[250px]">
              <SortButton column="name">{t('customer')}</SortButton>
            </TableHead>
            <TableHead className="w-[200px]">{t('nextAppointment')}</TableHead>
            <TableHead className="w-[100px]">
              <SortButton column="totalVisits">{t('visits')}</SortButton>
            </TableHead>
            <TableHead className="w-[130px]">
              <SortButton column="lastVisitDate">{t('lastVisit')}</SortButton>
            </TableHead>
            <TableHead className="w-[140px]">{t('preferredStylist')}</TableHead>
            <TableHead className="w-[100px]">{t('contact')}</TableHead>
            <TableHead className="w-[100px]">{t('status')}</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map(customer => (
            <TableRow key={customer.id} className="hover:bg-muted/30 cursor-pointer">
              {/* Customer */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={customer.avatar} alt={customer.name} />
                    <AvatarFallback className="text-xs">
                      {getInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
              </TableCell>

              {/* Next Appointment */}
              <TableCell>
                {customer.nextAppointment ? (
                  <div>
                    <p className="font-medium text-sm">
                      {customer.nextAppointment.categoryTitle || t('appointment')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(customer.nextAppointment.date)} -{' '}
                      {formatTime(customer.nextAppointment.time)}
                    </p>
                    {customer.nextAppointment.stylistName && (
                      <p className="text-xs text-muted-foreground">
                        {t('with')} {customer.nextAppointment.stylistName}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{t('noUpcoming')}</span>
                )}
              </TableCell>

              {/* Total Visits */}
              <TableCell>
                <Badge variant="outline" className="font-normal">
                  {customer.totalVisits}
                </Badge>
              </TableCell>

              {/* Last Visit */}
              <TableCell>
                {customer.lastVisitDate ? (
                  <span className="text-sm" title={formatDate(customer.lastVisitDate)}>
                    {formatRelativeDate(customer.lastVisitDate)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>

              {/* Preferred Stylist */}
              <TableCell>
                {customer.preferredStylist ? (
                  <span className="text-sm">{customer.preferredStylist.name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>

              {/* Contact Method */}
              <TableCell>{getContactMethodIcon(customer)}</TableCell>

              {/* Status */}
              <TableCell>
                <Badge variant={getStatusBadgeVariant(customer.status)} className="text-xs">
                  {statusLabel[customer.status]}
                </Badge>
              </TableCell>

              {/* Actions */}
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

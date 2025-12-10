'use client';

import { useEffect, useState, useCallback } from 'react';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import CustomerCard from '@/components/admin/customers/CustomerCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Refresh } from '@/lib/icons';
import {
  Earth,
  MoreHorizontal,
  Calendar,
  User,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import TelegramIcon from '@/components/icons/telegram';
import WhatsappIcon from '@/components/icons/whatsapp';
import { useTranslations, useFormatter } from 'next-intl';
import { toast } from 'sonner';
import type { CustomerWithStats, CustomerStatus } from '@/types';

interface CustomersApiResponse {
  customers: CustomerWithStats[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  statusCounts: {
    all: number;
    NEW: number;
    ACTIVE: number;
    AT_RISK: number;
    CHURNED: number;
  };
}

export default function CustomersPage() {
  const t = useTranslations('Admin.Customers');
  const format = useFormatter();

  const [data, setData] = useState<CustomersApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('lastVisitDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch customers');

      const result = (await response.json()) as CustomersApiResponse;
      setData(result);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error(t('fetchError'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, pageSize, sortBy, sortOrder, searchTerm, statusFilter, t]);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, pageSize, sortBy, sortOrder, statusFilter, searchTerm, fetchCustomers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCustomers();
    toast.success(t('refreshed'));
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const formatRelativeDate = (date: Date | string | undefined) => {
    if (!date) return t('never');
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format.relativeTime(dateObj);
  };

  const formatAppointmentDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format.dateTime(dateObj, { day: 'numeric', month: 'short' });
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

  const getContactIcon = (customer: CustomerWithStats) => {
    if (customer.telegramId) return <TelegramIcon width={14} height={14} />;
    if (customer.whatsappPhone) return <WhatsappIcon width={14} height={14} />;
    return <Earth className="w-3.5 h-3.5" />;
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" message={t('loading')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {data
              ? t('showing', {
                  start: (currentPage - 1) * pageSize + 1,
                  end: Math.min(currentPage * pageSize, data.pagination.totalCount),
                  total: data.pagination.totalCount,
                })
              : t('loading')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <Refresh className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      {/* Status Filter Tabs */}
      {data?.statusCounts && (
        <div className="flex flex-wrap gap-2">
          {(['all', 'ACTIVE', 'NEW', 'AT_RISK', 'CHURNED'] as const).map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
            >
              {t(`status.${status.toLowerCase()}`)}
              <Badge variant="secondary" className="ml-2 text-xs">
                {status === 'all' ? data.statusCounts.all : data.statusCounts[status]}
              </Badge>
            </Button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="p-4 bg-white border border-border rounded-lg">
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-8 text-center">
          <LoadingSpinner size="md" message={t('loading')} />
        </div>
      ) : !data?.customers.length ? (
        <div className="bg-white border border-border rounded-lg p-12 text-center">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('noCustomers')}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden lg:block bg-white border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">{t('columns.customer')}</TableHead>
                  <TableHead>{t('columns.status')}</TableHead>
                  <TableHead>{t('columns.contact')}</TableHead>
                  <TableHead>{t('columns.nextAppointment')}</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('totalVisits')}
                  >
                    {t('columns.visits')}
                    {sortBy === 'totalVisits' && (sortOrder === 'desc' ? ' ↓' : ' ↑')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('lastVisitDate')}
                  >
                    {t('columns.lastVisit')}
                    {sortBy === 'lastVisitDate' && (sortOrder === 'desc' ? ' ↓' : ' ↑')}
                  </TableHead>
                  <TableHead>{t('columns.stylist')}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.customers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={customer.avatar} alt={customer.name} />
                          <AvatarFallback className="text-xs">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(customer.status)} className="text-xs">
                        {t(`status.${customer.status.toLowerCase()}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 text-xs font-normal">
                        {getContactIcon(customer)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.nextAppointment ? (
                        <div className="text-sm">
                          <p className="font-medium">
                            {formatAppointmentDate(customer.nextAppointment.date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {customer.nextAppointment.time}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{customer.totalVisits}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeDate(customer.lastVisitDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {customer.preferredStylist ? (
                        <Badge variant="secondary" className="text-xs font-normal">
                          {customer.preferredStylist.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <User className="w-4 h-4 mr-2" />
                            {t('viewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="w-4 h-4 mr-2" />
                            {t('bookAppointment')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {t('contact')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards - Hidden on desktop */}
          <div className="lg:hidden space-y-4">
            {data.customers.map(customer => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select
              value={pageSize.toString()}
              onValueChange={v => {
                setPageSize(parseInt(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{t('perPage')}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('previous')}
            </Button>
            <span className="flex items-center px-3 text-sm">
              {currentPage} / {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === data.pagination.totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              {t('next')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

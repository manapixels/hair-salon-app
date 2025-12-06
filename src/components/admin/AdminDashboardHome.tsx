'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Calendar, TrendingUp, Clock, DollarSign, ChevronRight, MessageSquare } from 'lucide-react';
import type { Appointment } from '@/types';
import { formatDisplayDate, formatTime12Hour } from '@/lib/timeUtils';

interface AdminDashboardHomeProps {
  appointments: Appointment[];
  flaggedChatCount?: number;
}

export default function AdminDashboardHome({
  appointments,
  flaggedChatCount = 0,
}: AdminDashboardHomeProps) {
  const t = useTranslations('Admin.Dashboard');
  const locale = useLocale();
  const basePath = `/${locale}/admin`;

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const appointmentsList = Array.isArray(appointments) ? appointments : [];

    const todayAppts = appointmentsList.filter(
      a => new Date(a.date) >= startOfToday && new Date(a.date) <= endOfToday,
    );

    const weekAppts = appointmentsList.filter(
      a => new Date(a.date) >= startOfWeek && new Date(a.date) <= endOfWeek,
    );

    const upcomingAppts = appointmentsList.filter(a => new Date(a.date) > endOfToday);

    return {
      today: todayAppts.length,
      thisWeek: weekAppts.length,
      upcoming: upcomingAppts.length,
      weekRevenue: weekAppts.reduce((sum, a) => sum + a.totalPrice, 0),
      todayAppointments: todayAppts.slice(0, 5), // First 5 for preview
    };
  }, [appointments]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title={t('today')}
            value={kpis.today}
            subtitle={t('appointments')}
            icon={<Calendar className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-100"
          />
          <KPICard
            title={t('thisWeek')}
            value={kpis.thisWeek}
            subtitle={t('appointments')}
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            iconBg="bg-green-100"
          />
          <KPICard
            title={t('upcoming')}
            value={kpis.upcoming}
            subtitle={t('futureBookings')}
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-100"
          />
          <KPICard
            title={t('weekRevenue')}
            value={`$${kpis.weekRevenue}`}
            subtitle={t('thisWeek')}
            icon={<DollarSign className="w-5 h-5 text-primary" />}
            iconBg="bg-primary/10"
          />
        </div>
      </section>

      {/* Flagged Chats Alert */}
      {flaggedChatCount > 0 && (
        <Link
          href={`${basePath}/chat`}
          className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <MessageSquare className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-900">
                {t('flaggedConversations', { count: flaggedChatCount })}
              </p>
              <p className="text-sm text-red-700">{t('requiresAttention')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400" />
        </Link>
      )}

      {/* Today's Appointments Preview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t('todaysAppointments')}</h2>
          <Link
            href={`${basePath}/appointments`}
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            {t('viewAll')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {kpis.todayAppointments.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t('noAppointmentsToday')}</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg divide-y divide-border">
            {kpis.todayAppointments.map(appointment => (
              <div
                key={appointment.id}
                className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-foreground">
                      {formatTime12Hour(appointment.time)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {appointment.totalDuration}m
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{appointment.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.services.map(s => s.name).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">${appointment.totalPrice}</p>
                  {appointment.stylist && (
                    <p className="text-sm text-muted-foreground">{appointment.stylist.name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('quickActions')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickActionCard
            href={`${basePath}/availability`}
            title={t('blockTime')}
            description={t('manageAvailability')}
            icon={<Clock className="w-5 h-5" />}
          />
          <QuickActionCard
            href={`${basePath}/stylists`}
            title={t('addStylist')}
            description={t('manageTeam')}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <QuickActionCard
            href={`${basePath}/settings/services`}
            title={t('updatePrices')}
            description={t('servicesPricing')}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <QuickActionCard
            href={`${basePath}/settings/closures`}
            title={t('addClosure')}
            description={t('holidaysClosures')}
            icon={<Calendar className="w-5 h-5" />}
          />
        </div>
      </section>
    </div>
  );
}

// --- Sub-components ---

function KPICard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white p-4 lg:p-5 border border-border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl lg:text-3xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center p-4 bg-white border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all text-center"
    >
      <div className="p-2 bg-muted rounded-lg mb-2 text-muted-foreground">{icon}</div>
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}

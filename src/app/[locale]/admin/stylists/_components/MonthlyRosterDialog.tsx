'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations, useFormatter } from 'next-intl';
import { User, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Stylist, BlockedPeriod } from '@/types';

interface MonthlyRosterDialogProps {
  stylists: Stylist[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to format date as YYYY-MM-DD in local timezone
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function MonthlyRosterDialog({
  stylists,
  open,
  onOpenChange,
}: MonthlyRosterDialogProps) {
  const t = useTranslations('Admin.Availability');
  const tStylists = useTranslations('Admin.Stylists');
  const format = useFormatter();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get all days in the current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: Date[] = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const daysInMonth = getDaysInMonth(currentMonth);

  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
  };

  const prevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
  };

  const getDayStatus = (stylist: Stylist, date: Date) => {
    const dateStr = formatLocalDate(date);

    // Check blocked dates
    const blockedDates = (stylist.blockedDates as any[]) || [];
    const blocked = blockedDates.find((b: string | BlockedPeriod) => {
      const bDate = typeof b === 'string' ? b : b.date;
      return bDate === dateStr;
    });

    if (blocked) {
      if (typeof blocked !== 'string' && !blocked.isFullDay) {
        return 'PARTIAL_BLOCK';
      }
      return 'BLOCKED';
    }

    // Check working hours
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const schedule = stylist.workingHours[dayName];

    if (schedule?.isWorking) {
      return 'WORKING';
    }

    return 'OFF';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WORKING':
        return 'bg-green-100 border-green-200';
      case 'BLOCKED':
        return 'bg-red-100 border-red-200';
      case 'PARTIAL_BLOCK':
        return 'bg-orange-100 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>{t('monthlyRoster')}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-4 py-2 border-b">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-lg min-w-[150px] text-center">
            {format.dateTime(currentMonth, { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="px-2 py-2 text-left font-medium border-b bg-gray-50 sticky left-0 z-20 min-w-[120px]">
                  {tStylists('title')}
                </th>
                {daysInMonth.map(day => (
                  <th
                    key={day.toISOString()}
                    className="px-0.5 py-1 text-center border-b bg-gray-50 min-w-[28px]"
                  >
                    <div className="text-[10px] font-medium">
                      {format.dateTime(day, { weekday: 'narrow' })}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {format.dateTime(day, { day: 'numeric' })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stylists.map(stylist => (
                <tr key={stylist.id} className="hover:bg-gray-50/50">
                  <td className="px-2 py-1 sticky left-0 bg-white z-10 border-r border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {stylist.avatar ? (
                          <Image
                            src={stylist.avatar}
                            alt={stylist.name}
                            width={24}
                            height={24}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900 text-xs truncate max-w-[80px]">
                        {stylist.name}
                      </span>
                    </div>
                  </td>
                  {daysInMonth.map(day => {
                    const status = getDayStatus(stylist, day);
                    return (
                      <td key={day.toISOString()} className="px-0.5 py-0.5 text-center border-b">
                        <div
                          className={`h-5 w-full rounded border ${getStatusColor(status)}`}
                          title={`${stylist.name}: ${status}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-3 border-t text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
            <span>{t('working')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
            <span>{t('blocked')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-gray-50 border border-gray-100" />
            <span>{t('off')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

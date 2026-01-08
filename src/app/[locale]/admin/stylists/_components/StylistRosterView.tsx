'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations, useFormatter } from 'next-intl';
import { User, ChevronLeft, ChevronRight } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import type { Stylist, BlockedPeriod } from '@/types';

interface StylistRosterViewProps {
  stylists: Stylist[];
}

export default function StylistRosterView({ stylists }: StylistRosterViewProps) {
  const t = useTranslations('Admin.Availability');
  const tStylists = useTranslations('Admin.Stylists');
  const format = useFormatter();

  const [currentDate, setCurrentDate] = useState(new Date());

  // Get start of the week (Monday)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(currentDate);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const getDayStatus = (stylist: Stylist, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];

    // Check blocked dates
    const blocked = (stylist.blockedDates as any[]).find((b: string | BlockedPeriod) => {
      const bDate = typeof b === 'string' ? b : b.date;
      return bDate === dateStr;
    });

    if (blocked) {
      if (typeof blocked !== 'string' && !blocked.isFullDay) {
        return { type: 'PARTIAL_BLOCK', info: blocked };
      }
      return { type: 'BLOCKED', info: blocked };
    }

    // Check working hours
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const schedule = stylist.workingHours[dayName];

    if (schedule?.isWorking) {
      return { type: 'WORKING', info: schedule };
    }

    return { type: 'OFF' };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-lg">{t('monthlyCalendarView')} (Weekly Roster)</h3>{' '}
        {/* Should translate properly */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[140px] text-center">
            {format.dateTime(startOfWeek, { month: 'short', day: 'numeric' })} -{' '}
            {format.dateTime(weekDays[6], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 min-w-[200px] sticky left-0 bg-gray-50 z-10">
                {tStylists('title')}
              </th>
              {weekDays.map(day => (
                <th key={day.toISOString()} className="px-2 py-3 min-w-[120px] text-center">
                  <div className="font-semibold">{format.dateTime(day, { weekday: 'short' })}</div>
                  <div className="text-xs text-gray-500">
                    {format.dateTime(day, { month: 'numeric', day: 'numeric' })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stylists.map(stylist => (
              <tr key={stylist.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {stylist.avatar ? (
                        <Image
                          src={stylist.avatar}
                          alt={stylist.name}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">{stylist.name}</span>
                  </div>
                </td>
                {weekDays.map(day => {
                  const status = getDayStatus(stylist, day);
                  return (
                    <td
                      key={day.toISOString()}
                      className="px-1 py-2 text-center h-16 border-r border-gray-50 last:border-0 relative group cursor-default"
                    >
                      {status.type === 'BLOCKED' && (
                        <div className="h-full w-full bg-red-100 text-red-700 rounded-md flex items-center justify-center flex-col p-1 text-xs">
                          <span className="font-bold">{t('blocked')}</span>
                          {(status.info as any)?.reason && (
                            <span className="text-[10px] truncate w-full">
                              {(status.info as any).reason}
                            </span>
                          )}
                        </div>
                      )}
                      {status.type === 'PARTIAL_BLOCK' && (
                        <div className="h-full w-full bg-orange-100 text-orange-800 rounded-md flex items-center justify-center flex-col p-1 text-xs border border-orange-200">
                          <span className="font-bold">Partial Block</span>
                          <span className="text-[10px]">
                            {(status.info as BlockedPeriod).startTime} -{' '}
                            {(status.info as BlockedPeriod).endTime}
                          </span>
                        </div>
                      )}
                      {status.type === 'WORKING' && (
                        <div className="h-full w-full bg-green-50 text-green-700 rounded-md flex items-center justify-center flex-col p-1 text-xs border border-green-100">
                          <span className="font-semibold">
                            {(status.info as any).start} - {(status.info as any).end}
                          </span>
                        </div>
                      )}
                      {status.type === 'OFF' && (
                        <div className="h-full w-full bg-gray-50 text-gray-400 rounded-md flex items-center justify-center text-xs">
                          {t('off')}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useTranslations, useFormatter } from 'next-intl';
import { User, ChevronLeft, ChevronRight } from '@/lib/icons';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MonthlyRosterDialog from './MonthlyRosterDialog';
import type { Stylist, BlockedPeriod } from '@/types';

interface StylistRosterViewProps {
  stylists: Stylist[];
  onStylistUpdate?: () => Promise<void>; // Callback to refresh stylists after update
}

// Helper to format date as YYYY-MM-DD in local timezone
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function StylistRosterView({ stylists, onStylistUpdate }: StylistRosterViewProps) {
  const t = useTranslations('Admin.Availability');
  const tStylists = useTranslations('Admin.Stylists');
  const format = useFormatter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [savingCells, setSavingCells] = useState<Set<string>>(new Set()); // Track multiple cells
  const [monthlyDialogOpen, setMonthlyDialogOpen] = useState(false);

  // Track pending changes per stylist to handle rapid clicks
  const pendingChangesRef = useRef<Map<string, BlockedPeriod[]>>(new Map());

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
    const dateStr = formatLocalDate(date);

    // Check pending changes first (for optimistic UI during rapid clicks)
    const pendingBlocked = pendingChangesRef.current.get(stylist.id);
    const blockedToCheck = pendingBlocked || (stylist.blockedDates as any[]) || [];

    // Check blocked dates
    const blocked = blockedToCheck.find((b: string | BlockedPeriod) => {
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

  const toggleDayAvailability = useCallback(
    async (stylist: Stylist, date: Date) => {
      const dateStr = formatLocalDate(date);
      const cellKey = `${stylist.id}-${dateStr}`;

      // Get status based on pending changes (optimistic)
      const status = getDayStatus(stylist, date);

      // Only toggle for WORKING or BLOCKED days
      if (status.type === 'OFF' || status.type === 'PARTIAL_BLOCK') {
        return; // Can't toggle OFF days (need to change working hours) or partial blocks
      }

      // Add to saving set
      setSavingCells(prev => new Set(prev).add(cellKey));

      // Get the current blocked dates - use pending if exists, otherwise from props
      const currentBlocked: BlockedPeriod[] = (
        pendingChangesRef.current.get(stylist.id) ||
        stylist.blockedDates ||
        []
      ).map((b: string | BlockedPeriod) => {
        if (typeof b === 'string') {
          return { date: b, isFullDay: true };
        }
        return b;
      });

      let newBlockedDates: BlockedPeriod[];
      if (status.type === 'WORKING') {
        // Add a new blocked date
        newBlockedDates = [...currentBlocked, { date: dateStr, isFullDay: true }];
      } else {
        // status.type === 'BLOCKED' - Remove the blocked date
        newBlockedDates = currentBlocked.filter(bp => bp.date !== dateStr);
      }

      // Store in pending changes ref immediately (for next rapid click to build upon)
      pendingChangesRef.current.set(stylist.id, newBlockedDates);

      try {
        const response = await fetch(`/api/stylists/${stylist.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            specialtyCategoryIds: stylist.specialties.map(cat => cat.id),
            blockedDates: newBlockedDates,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update availability');
        }

        toast.success(t('savedSuccess'));
      } catch (error) {
        console.error('Failed to toggle availability:', error);
        toast.error(t('saveFailed'));
      } finally {
        // Remove from saving set
        setSavingCells(prev => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);

          // Check if this was the last pending request for ANY stylist
          // If so, trigger a refresh
          const remainingForThisStylist = Array.from(newSet).filter(k =>
            k.startsWith(stylist.id + '-'),
          );
          if (remainingForThisStylist.length === 0) {
            // Clear pending for this stylist and refresh
            pendingChangesRef.current.delete(stylist.id);
            if (onStylistUpdate) {
              onStylistUpdate();
            }
          }

          return newSet;
        });
      }
    },
    [onStylistUpdate, t],
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header - stacks on mobile */}
      <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-base sm:text-lg">{t('weeklyRoster')}</h3>
          <Button variant="outline" size="sm" onClick={() => setMonthlyDialogOpen(true)}>
            <CalendarDays className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:flex">{t('viewMonth')}</span>
          </Button>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={prevWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-xs sm:text-sm min-w-[80px] sm:min-w-[140px] text-center">
            {format.dateTime(startOfWeek, { month: 'short', day: 'numeric' })} -
            <span className="inline sm:hidden">
              <br />
            </span>{' '}
            {format.dateTime(weekDays[6], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={nextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
            <tr>
              <th className="px-2 sm:px-4 py-2 sm:py-3 min-w-[80px] sm:min-w-[160px] sticky left-0 bg-gray-50 z-10 text-xs sm:text-sm">
                {tStylists('title')}
              </th>
              {weekDays.map(day => (
                <th
                  key={day.toISOString()}
                  className="px-0.5 sm:px-2 py-2 sm:py-3 min-w-[52px] sm:min-w-[100px] text-center"
                >
                  <div className="font-semibold text-xs sm:text-sm">
                    {format.dateTime(day, { weekday: 'narrow' })}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">
                    {format.dateTime(day, { day: 'numeric' })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stylists.map(stylist => (
              <tr key={stylist.id} className="hover:bg-gray-50/50">
                <td className="px-2 sm:px-4 py-2 sm:py-3 sticky left-0 bg-white z-10 border-r border-gray-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Avatar - hidden on very small screens */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {stylist.avatar ? (
                        <Image
                          src={stylist.avatar}
                          alt={stylist.name}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900 text-xs sm:text-sm truncate max-w-[60px] sm:max-w-none">
                      {stylist.name}
                    </span>
                  </div>
                </td>
                {weekDays.map(day => {
                  const status = getDayStatus(stylist, day);
                  const dateStr = formatLocalDate(day);
                  const cellKey = `${stylist.id}-${dateStr}`;
                  const isSaving = savingCells.has(cellKey);

                  return (
                    <td
                      key={day.toISOString()}
                      className="px-0.5 sm:px-1 py-1 sm:py-2 text-center h-12 sm:h-16 border-r border-gray-50 last:border-0 relative"
                    >
                      {status.type === 'BLOCKED' && (
                        <button
                          type="button"
                          onClick={() => toggleDayAvailability(stylist, day)}
                          disabled={isSaving}
                          className="h-full w-full bg-red-100 text-red-700 rounded sm:rounded-md flex items-center justify-center flex-col p-0.5 sm:p-1 text-[10px] sm:text-xs hover:bg-red-200 transition-colors cursor-pointer disabled:opacity-50"
                          title="Click to unblock this day"
                        >
                          {isSaving ? (
                            <span className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-red-300 border-t-red-600 rounded-full"></span>
                          ) : (
                            <>
                              <span className="font-bold">{t('blocked')}</span>
                              {(status.info as any)?.reason && (
                                <span className="text-[8px] sm:text-[10px] truncate w-full hidden sm:block">
                                  {(status.info as any).reason}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      )}
                      {status.type === 'PARTIAL_BLOCK' && (
                        <div className="h-full w-full bg-orange-100 text-orange-800 rounded sm:rounded-md flex items-center justify-center flex-col p-0.5 sm:p-1 text-[10px] sm:text-xs border border-orange-200">
                          <span className="font-bold text-[10px] sm:text-xs">Partial</span>
                          <span className="text-[8px] sm:text-[10px] hidden sm:block">
                            {(status.info as BlockedPeriod).startTime} -{' '}
                            {(status.info as BlockedPeriod).endTime}
                          </span>
                        </div>
                      )}
                      {status.type === 'WORKING' && (
                        <button
                          type="button"
                          onClick={() => toggleDayAvailability(stylist, day)}
                          disabled={isSaving}
                          className="h-full w-full bg-green-50 text-green-700 rounded sm:rounded-md flex items-center justify-center flex-col p-0.5 sm:p-1 text-[10px] sm:text-xs border border-green-100 hover:bg-green-100 hover:border-green-200 transition-colors cursor-pointer disabled:opacity-50"
                          title="Click to block this day"
                        >
                          {isSaving ? (
                            <span className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-green-300 border-t-green-600 rounded-full"></span>
                          ) : (
                            <span className="font-semibold leading-tight">
                              <span>
                                {(status.info as any).start} - {(status.info as any).end}
                              </span>
                            </span>
                          )}
                        </button>
                      )}
                      {status.type === 'OFF' && (
                        <div className="h-full w-full bg-gray-50 text-gray-400 rounded sm:rounded-md flex items-center justify-center text-[10px] sm:text-xs">
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

      {/* Monthly Roster Dialog */}
      <MonthlyRosterDialog
        stylists={stylists}
        open={monthlyDialogOpen}
        onOpenChange={setMonthlyDialogOpen}
      />
    </div>
  );
}

'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useTranslations, useFormatter } from 'next-intl';
import { User, ChevronLeft, ChevronRight } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import type { Stylist, BlockedPeriod } from '@/types';

interface StylistRosterViewProps {
  stylists: Stylist[];
  onStylistUpdate?: () => Promise<void>; // Callback to refresh stylists after update
}

export default function StylistRosterView({ stylists, onStylistUpdate }: StylistRosterViewProps) {
  const t = useTranslations('Admin.Availability');
  const tStylists = useTranslations('Admin.Stylists');
  const format = useFormatter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [savingCells, setSavingCells] = useState<Set<string>>(new Set()); // Track multiple cells

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
    const dateStr = date.toISOString().split('T')[0];

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
      const dateStr = date.toISOString().split('T')[0];
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
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-lg">{t('weeklyRoster')}</h3>
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
                  const dateStr = day.toISOString().split('T')[0];
                  const cellKey = `${stylist.id}-${dateStr}`;
                  const isSaving = savingCells.has(cellKey);
                  const isClickable = status.type === 'WORKING' || status.type === 'BLOCKED';

                  return (
                    <td
                      key={day.toISOString()}
                      className="px-1 py-2 text-center h-16 border-r border-gray-50 last:border-0 relative"
                    >
                      {status.type === 'BLOCKED' && (
                        <button
                          type="button"
                          onClick={() => toggleDayAvailability(stylist, day)}
                          disabled={isSaving}
                          className="h-full w-full bg-red-100 text-red-700 rounded-md flex items-center justify-center flex-col p-1 text-xs hover:bg-red-200 transition-colors cursor-pointer disabled:opacity-50"
                          title="Click to unblock this day"
                        >
                          {isSaving ? (
                            <span className="animate-spin h-4 w-4 border-2 border-red-300 border-t-red-600 rounded-full"></span>
                          ) : (
                            <>
                              <span className="font-bold">{t('blocked')}</span>
                              {(status.info as any)?.reason && (
                                <span className="text-[10px] truncate w-full">
                                  {(status.info as any).reason}
                                </span>
                              )}
                            </>
                          )}
                        </button>
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
                        <button
                          type="button"
                          onClick={() => toggleDayAvailability(stylist, day)}
                          disabled={isSaving}
                          className="h-full w-full bg-green-50 text-green-700 rounded-md flex items-center justify-center flex-col p-1 text-xs border border-green-100 hover:bg-green-100 hover:border-green-200 transition-colors cursor-pointer disabled:opacity-50"
                          title="Click to block this day"
                        >
                          {isSaving ? (
                            <span className="animate-spin h-4 w-4 border-2 border-green-300 border-t-green-600 rounded-full"></span>
                          ) : (
                            <span className="font-semibold">
                              {(status.info as any).start} - {(status.info as any).end}
                            </span>
                          )}
                        </button>
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

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';
import * as Select from '@radix-ui/react-select';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Stylist, BlockedPeriod } from '@/types';
import { Plus, X, ChevronDown, User } from '@/lib/icons';

interface ManageBlockedDatesProps {
  onNavigateToStylists?: () => void;
  stylistId?: string; // Optional: if provided, locks the calendar to this stylist
}

// Helper to normalize blocked dates to BlockedPeriod format
const normalizeBlockedDates = (dates: (string | BlockedPeriod)[] | undefined): BlockedPeriod[] => {
  if (!dates || !Array.isArray(dates)) return [];
  return dates.map(d => {
    if (typeof d === 'string') {
      return { date: d, isFullDay: true };
    }
    return d;
  });
};

export default function ManageBlockedDates({
  onNavigateToStylists,
  stylistId: propStylistId,
}: ManageBlockedDatesProps) {
  const t = useTranslations('Admin.Availability');

  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedStylistId, setSelectedStylistId] = useState<string>(propStylistId || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Blocked dates editing state
  const [blockedDates, setBlockedDates] = useState<BlockedPeriod[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('18:00');
  const [isFullDayBlock, setIsFullDayBlock] = useState(true);
  const [blockReason, setBlockReason] = useState('');

  // Time options for dropdowns
  const timeOptions = useMemo(() => {
    const times: string[] = [];
    for (let h = 6; h <= 22; h++) {
      times.push(`${h.toString().padStart(2, '0')}:00`);
      times.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return times;
  }, []);

  useEffect(() => {
    if (propStylistId) {
      setSelectedStylistId(propStylistId);
    }
  }, [propStylistId]);

  const fetchStylists = useCallback(async () => {
    try {
      const response = await fetch('/api/stylists');
      if (!response.ok) throw new Error('Failed to load stylists');
      const data = (await response.json()) as Stylist[];
      if (Array.isArray(data)) {
        setStylists(data);
        if (data.length > 0 && !propStylistId) {
          setSelectedStylistId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stylists:', error);
    } finally {
      setIsLoading(false);
    }
  }, [propStylistId]);

  useEffect(() => {
    fetchStylists();
  }, [fetchStylists]);

  const selectedStylist = stylists.find(s => s.id === selectedStylistId);

  // Sync blocked dates when stylist changes
  useEffect(() => {
    if (selectedStylist) {
      setBlockedDates(normalizeBlockedDates(selectedStylist.blockedDates));
    }
  }, [selectedStylist]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const isDateBlocked = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return blockedDates.some(d => d.date === dateStr);
  };

  const isDayWorking = (date: Date) => {
    if (!selectedStylist) return false;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hours =
      selectedStylist.workingHours[dayName as keyof typeof selectedStylist.workingHours];
    return hours?.isWorking ?? false;
  };

  const addBlockedPeriod = async () => {
    if (!dateRange?.from || !selectedStylist) return;

    const newPeriods: BlockedPeriod[] = [];
    const startDate = dateRange.from;
    const endDate = dateRange.to || dateRange.from;

    // Generate all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Use local date format to avoid timezone issues
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Check if this date is already blocked
      const existingIndex = blockedDates.findIndex(bp => bp.date === dateStr);
      if (existingIndex === -1) {
        newPeriods.push({
          date: dateStr,
          isFullDay: isFullDayBlock,
          startTime: isFullDayBlock ? undefined : blockStartTime,
          endTime: isFullDayBlock ? undefined : blockEndTime,
          reason: blockReason || undefined,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (newPeriods.length > 0) {
      const updatedBlockedDates = [...blockedDates, ...newPeriods].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      setBlockedDates(updatedBlockedDates);

      // Save immediately
      setIsSaving(true);
      const toastId = toast.loading(t('savingBlockedDates'));
      try {
        const response = await fetch(`/api/stylists/${selectedStylist.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...selectedStylist,
            specialtyCategoryIds: selectedStylist.specialties.map(cat => cat.id),
            blockedDates: updatedBlockedDates,
          }),
        });

        if (!response.ok) throw new Error(t('saveFailed'));
        await fetchStylists();
        toast.success(t('savedSuccess'), { id: toastId });
      } catch (error) {
        console.error('Failed to save blocked dates:', error);
        toast.error(t('saveFailed'), { id: toastId });
      } finally {
        setIsSaving(false);
      }
    }

    // Reset
    setDateRange(undefined);
    setBlockReason('');
    setShowTimeOptions(false);
    setIsFullDayBlock(true);
  };

  const removeBlockedDate = async (date: string) => {
    if (!selectedStylist) return;

    const updatedBlockedDates = blockedDates.filter(bp => bp.date !== date);
    setBlockedDates(updatedBlockedDates);

    // Save immediately
    setIsSaving(true);
    const toastId = toast.loading(t('savingBlockedDates'));
    try {
      const response = await fetch(`/api/stylists/${selectedStylist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedStylist,
          specialtyCategoryIds: selectedStylist.specialties.map(cat => cat.id),
          blockedDates: updatedBlockedDates,
        }),
      });

      if (!response.ok) throw new Error(t('saveFailed'));
      await fetchStylists();
      toast.success(t('savedSuccess'), { id: toastId });
    } catch (error) {
      console.error('Failed to remove blocked date:', error);
      toast.error(t('saveFailed'), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const formatBlockedPeriod = (bp: BlockedPeriod) => {
    const dateFormatted = new Date(bp.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    if (bp.isFullDay) {
      return `${dateFormatted} (All day)`;
    }
    return `${dateFormatted} (${bp.startTime} - ${bp.endTime})`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" message={t('loading')} />
      </div>
    );
  }

  if (stylists.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
        <svg
          className="w-12 h-12 text-gray-400 mx-auto mb-[3]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="text-[length:var(--font-size-3)] font-medium text-muted-foreground mb-1">
          {t('noStylistsYet')}
        </p>
        <p className="text-sm text-gray-500 mb-4">{t('noStylistsDesc')}</p>
        {onNavigateToStylists && (
          <button
            onClick={onNavigateToStylists}
            className="px-[4] py-2 bg-primary text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t('goToStylists')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedStylist && (
        <>
          {/* Stylist Info Card */}
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {selectedStylist.avatar ? (
                    <Image
                      src={selectedStylist.avatar}
                      alt={selectedStylist.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">{selectedStylist.name}</h4>
                  {selectedStylist.email && (
                    <p className="text-sm text-muted-foreground">{selectedStylist.email}</p>
                  )}
                </div>
              </div>
              {onNavigateToStylists && (
                <button
                  onClick={onNavigateToStylists}
                  className="px-3 py-2 text-sm text-primary hover:text-primary font-medium transition-colors"
                >
                  {t('editFullProfile')}
                </button>
              )}
            </div>
          </div>

          {/* Blocked Dates Management Section */}
          <div>
            <div className="mb-2">
              <h4 className="text-[length:var(--font-size-3)] font-semibold text-foreground">
                {t('manageBlockedDates')}
              </h4>
            </div>
            <div className="text-sm text-muted-foreground mb-4">{t('blockedDatesDesc')}</div>

            {/* Calendar and Blocked Dates List - side by side */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Calendar for selecting dates to block */}
              <div className="flex flex-col items-center">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  disabled={{ before: new Date() }}
                  className="rounded-md border"
                  numberOfMonths={1}
                  modifiers={{
                    blocked: blockedDates.map(bp => new Date(bp.date + 'T00:00:00')),
                  }}
                  modifiersClassNames={{
                    blocked: 'bg-red-100 text-red-700 hover:bg-red-200',
                  }}
                />

                {dateRange?.from && (
                  <div className="mt-3 w-full max-w-md space-y-3">
                    <div className="text-sm text-gray-600 text-center">
                      Selected: {dateRange.from.toLocaleDateString()}
                      {dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime() && (
                        <> to {dateRange.to.toLocaleDateString()}</>
                      )}
                    </div>

                    {/* Collapsible time options */}
                    <Collapsible open={showTimeOptions} onOpenChange={setShowTimeOptions}>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center justify-center w-full text-sm text-gray-600 hover:text-gray-900"
                        >
                          <ChevronDown
                            className={`w-4 h-4 mr-1 transition-transform ${showTimeOptions ? 'rotate-180' : ''}`}
                          />
                          Advanced: Time Options
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 p-3 bg-gray-50 rounded-md space-y-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="full-day-block"
                            checked={isFullDayBlock}
                            onCheckedChange={checked => setIsFullDayBlock(!!checked)}
                          />
                          <label htmlFor="full-day-block" className="text-sm text-gray-700">
                            Block entire day
                          </label>
                        </div>

                        {!isFullDayBlock && (
                          <div className="flex items-center gap-2 ml-6">
                            <span className="text-sm text-gray-600">Block from</span>
                            <select
                              value={blockStartTime}
                              onChange={e => setBlockStartTime(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              {timeOptions.map(t => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                            <span className="text-sm text-gray-600">to</span>
                            <select
                              value={blockEndTime}
                              onChange={e => setBlockEndTime(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              {timeOptions.map(t => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="ml-0">
                          <label className="text-sm text-gray-600 block mb-1">
                            Reason (optional)
                          </label>
                          <Input
                            type="text"
                            value={blockReason}
                            onChange={e => setBlockReason(e.target.value)}
                            placeholder="e.g., Doctor appointment, Vacation"
                            className="text-sm"
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <Button type="button" onClick={addBlockedPeriod} className="w-full">
                      <Plus className="w-4 h-4 mr-1" />
                      {t('addBlockedPeriod')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Blocked Dates Vertical List */}
              <div className="flex-1 min-w-[200px]">
                <h5 className="text-sm font-medium text-foreground mb-2">Blocked Dates</h5>
                {blockedDates.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-2">{t('noBlockedDates')}</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {blockedDates.map(bp => (
                      <div
                        key={bp.date}
                        className="flex items-center justify-between gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm border border-red-100"
                      >
                        <div>
                          <div className="font-medium">{formatBlockedPeriod(bp)}</div>
                          {bp.reason && <div className="text-red-500 text-xs">{bp.reason}</div>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBlockedDate(bp.date)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

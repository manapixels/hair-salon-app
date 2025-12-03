import { useState, useEffect } from 'react';
import { formatDisplayDate } from '@/lib/timeUtils';
import * as Select from '@radix-ui/react-select';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import type { Stylist } from '@/types';

interface StylistAvailabilityProps {
  onNavigateToStylists?: () => void;
}

export default function StylistAvailability({ onNavigateToStylists }: StylistAvailabilityProps) {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedStylistId, setSelectedStylistId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchStylists();
  }, []);

  const fetchStylists = async () => {
    try {
      const response = await fetch('/api/stylists');
      if (!response.ok) throw new Error('Failed to load stylists');
      const data = await response.json();
      if (Array.isArray(data)) {
        setStylists(data);
        if (data.length > 0) {
          setSelectedStylistId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stylists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedStylist = stylists.find(s => s.id === selectedStylistId);

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
    if (!selectedStylist) return false;
    const dateStr = date.toISOString().split('T')[0];
    return selectedStylist.blockedDates.includes(dateStr);
  };

  const isDayWorking = (date: Date) => {
    if (!selectedStylist) return false;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hours =
      selectedStylist.workingHours[dayName as keyof typeof selectedStylist.workingHours];
    return hours?.isWorking ?? false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" message="Loading stylists..." />
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
          No Stylists Yet
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Add stylists to manage their individual availability schedules.
        </p>
        {onNavigateToStylists && (
          <button
            onClick={onNavigateToStylists}
            className="px-[4] py-2 bg-accent text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to Stylists Tab
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-[2]">Per-Stylist Availability</h3>
        <p className="text-sm text-muted-foreground">
          View each stylist&apos;s working schedule and blocked dates. To edit, use the Stylists
          tab.
        </p>
      </div>

      {/* Stylist Selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-[2]">Select Stylist</label>
        <Select.Root value={selectedStylistId} onValueChange={setSelectedStylistId}>
          <Select.Trigger className="inline-flex items-center justify-between gap-[2] px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-background text-sm text-foreground hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent min-w-[250px]">
            <Select.Value />
            <Select.Icon>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="overflow-hidden bg-card rounded-md border border-border shadow-lg">
              <Select.Viewport className="p-[0.5]">
                {stylists.map(stylist => (
                  <Select.Item
                    key={stylist.id}
                    value={stylist.id}
                    className="relative flex items-center px-3 py-2 rounded-sm text-sm text-foreground hover:bg-accent/20 focus:bg-accent/20 outline-none cursor-pointer data-[highlighted]:bg-accent/20"
                  >
                    <Select.ItemText>{stylist.name}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {selectedStylist && (
        <>
          {/* Stylist Info Card */}
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-bold text-foreground mb-1">{selectedStylist.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">{selectedStylist.email}</p>
                {selectedStylist.bio && (
                  <p className="text-sm text-muted-foreground">{selectedStylist.bio}</p>
                )}
              </div>
              {onNavigateToStylists && (
                <button
                  onClick={onNavigateToStylists}
                  className="px-3 py-2 text-sm text-accent-foreground hover:text-accent-foreground font-medium transition-colors"
                >
                  Edit Full Profile →
                </button>
              )}
            </div>
          </div>

          {/* Working Hours */}
          <div>
            <h4 className="text-[length:var(--font-size-3)] font-semibold text-foreground mb-[3]">
              Working Hours
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[3]">
              {Object.entries(selectedStylist.workingHours).map(([day, hours]) => (
                <div
                  key={day}
                  className="flex items-center justify-between p-[3] bg-muted border border-border rounded-md"
                >
                  <span className="text-sm font-medium text-foreground capitalize">{day}</span>
                  <span className="text-sm text-muted-foreground">
                    {hours.isWorking ? `${hours.start} - ${hours.end}` : 'Off'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar View */}
          <div>
            <div className="flex items-center justify-between mb-[4]">
              <h4 className="text-[length:var(--font-size-3)] font-semibold text-foreground">
                Blocked Dates Calendar
              </h4>
              <div className="flex items-center space-x-[3]">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
                    )
                  }
                  className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-md transition-colors"
                  aria-label="Previous month"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <span className="text-[length:var(--font-size-3)] font-medium text-foreground min-w-[150px] text-center">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
                    )
                  }
                  className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-md transition-colors"
                  aria-label="Next month"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
              {getDaysInMonth(currentMonth).map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const isBlocked = isDateBlocked(date);
                const isWorking = isDayWorking(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={date.toISOString()}
                    className={`aspect-square p-[2] rounded-md text-center text-sm border transition-colors ${
                      isBlocked
                        ? 'bg-destructive/10 border-destructive text-destructive'
                        : !isWorking
                          ? 'bg-gray-100 dark:bg-gray-800 border-border text-gray-400'
                          : 'bg-muted border-gray-300 dark:border-gray-600 text-foreground'
                    } ${isToday ? 'ring-2 ring-accent' : ''}`}
                  >
                    <div className="font-medium">{date.getDate()}</div>
                    {isBlocked && <div className="text-xs mt-0.5">Blocked</div>}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-[4] flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-[2]">
                <div className="w-4 h-4 rounded-sm bg-muted border border-gray-300 dark:border-gray-600"></div>
                <span className="text-muted-foreground">Working Day</span>
              </div>
              <div className="flex items-center space-x-[2]">
                <div className="w-4 h-4 rounded-sm bg-gray-100 dark:bg-gray-800 border border-border"></div>
                <span className="text-muted-foreground">Day Off</span>
              </div>
              <div className="flex items-center space-x-[2]">
                <div className="w-4 h-4 rounded-sm bg-destructive/10 border border-destructive"></div>
                <span className="text-muted-foreground">Blocked Date</span>
              </div>
            </div>
          </div>

          {/* Blocked Dates List */}
          {selectedStylist.blockedDates.length > 0 && (
            <div>
              <h4 className="text-[length:var(--font-size-3)] font-semibold text-foreground mb-[3]">
                Upcoming Blocked Dates
              </h4>
              <div className="space-y-[2]">
                {selectedStylist.blockedDates
                  .filter(date => date >= new Date().toISOString().split('T')[0])
                  .sort()
                  .slice(0, 5)
                  .map(date => (
                    <div
                      key={date}
                      className="flex items-center space-x-[3] p-[3] bg-destructive/10 border border-destructive rounded-md"
                    >
                      <svg
                        className="w-5 h-5 text-destructive"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span className="text-sm font-medium text-foreground">
                        {formatDisplayDate(new Date(date))}
                      </span>
                      <span className="text-xs text-muted-foreground">({date})</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

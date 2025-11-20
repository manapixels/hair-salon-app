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
      <div className="flex items-center justify-center p-[var(--space-8)]">
        <LoadingSpinner size="md" message="Loading stylists..." />
      </div>
    );
  }

  if (stylists.length === 0) {
    return (
      <div className="text-center py-[var(--space-8)] border-2 border-dashed border-[var(--gray-6)] rounded-[var(--radius-3)]">
        <svg
          className="w-12 h-12 text-[var(--gray-9)] mx-auto mb-[var(--space-3)]"
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
        <p className="text-[length:var(--font-size-3)] font-medium text-[var(--gray-11)] mb-1">
          No Stylists Yet
        </p>
        <p className="text-[length:var(--font-size-2)] text-[var(--gray-10)] mb-4">
          Add stylists to manage their individual availability schedules.
        </p>
        {onNavigateToStylists && (
          <button
            onClick={onNavigateToStylists}
            className="px-[var(--space-4)] py-[var(--space-2)] bg-accent text-white rounded-[var(--radius-2)] text-[length:var(--font-size-2)] font-medium hover:opacity-90 transition-opacity"
          >
            Go to Stylists Tab
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-[var(--space-6)]">
      <div>
        <h3 className="text-[length:var(--font-size-5)] font-bold text-[var(--gray-12)] mb-[var(--space-2)]">
          Per-Stylist Availability
        </h3>
        <p className="text-[length:var(--font-size-2)] text-[var(--gray-11)]">
          View each stylist&apos;s working schedule and blocked dates. To edit, use the Stylists
          tab.
        </p>
      </div>

      {/* Stylist Selector */}
      <div>
        <label className="block text-[length:var(--font-size-2)] font-medium text-[var(--gray-12)] mb-[var(--space-2)]">
          Select Stylist
        </label>
        <Select.Root value={selectedStylistId} onValueChange={setSelectedStylistId}>
          <Select.Trigger className="inline-flex items-center justify-between gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-2)] border border-[var(--gray-7)] bg-[var(--color-surface)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:border-[var(--gray-8)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] min-w-[250px]">
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
            <Select.Content className="overflow-hidden bg-[var(--color-panel-solid)] rounded-[var(--radius-2)] border border-[var(--gray-6)] shadow-lg">
              <Select.Viewport className="p-[var(--space-1)]">
                {stylists.map(stylist => (
                  <Select.Item
                    key={stylist.id}
                    value={stylist.id}
                    className="relative flex items-center px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-1)] text-[length:var(--font-size-2)] text-[var(--gray-12)] hover:bg-[var(--accent-4)] focus:bg-[var(--accent-4)] outline-none cursor-pointer data-[highlighted]:bg-[var(--accent-4)]"
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
          <div className="bg-[var(--gray-2)] border border-[var(--gray-6)] rounded-[var(--radius-3)] p-[var(--space-4)]">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-[length:var(--font-size-4)] font-bold text-[var(--gray-12)] mb-1">
                  {selectedStylist.name}
                </h4>
                <p className="text-[length:var(--font-size-2)] text-[var(--gray-11)] mb-2">
                  {selectedStylist.email}
                </p>
                {selectedStylist.bio && (
                  <p className="text-[length:var(--font-size-2)] text-[var(--gray-11)]">
                    {selectedStylist.bio}
                  </p>
                )}
              </div>
              {onNavigateToStylists && (
                <button
                  onClick={onNavigateToStylists}
                  className="px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-2)] text-[var(--accent-11)] hover:text-[var(--accent-12)] font-medium transition-colors"
                >
                  Edit Full Profile →
                </button>
              )}
            </div>
          </div>

          {/* Working Hours */}
          <div>
            <h4 className="text-[length:var(--font-size-3)] font-semibold text-[var(--gray-12)] mb-[var(--space-3)]">
              Working Hours
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-3)]">
              {Object.entries(selectedStylist.workingHours).map(([day, hours]) => (
                <div
                  key={day}
                  className="flex items-center justify-between p-[var(--space-3)] bg-[var(--gray-2)] border border-[var(--gray-6)] rounded-[var(--radius-2)]"
                >
                  <span className="text-[length:var(--font-size-2)] font-medium text-[var(--gray-12)] capitalize">
                    {day}
                  </span>
                  <span className="text-[length:var(--font-size-2)] text-[var(--gray-11)]">
                    {hours.isWorking ? `${hours.start} - ${hours.end}` : 'Off'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar View */}
          <div>
            <div className="flex items-center justify-between mb-[var(--space-4)]">
              <h4 className="text-[length:var(--font-size-3)] font-semibold text-[var(--gray-12)]">
                Blocked Dates Calendar
              </h4>
              <div className="flex items-center space-x-[var(--space-3)]">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
                    )
                  }
                  className="p-2 hover:bg-[var(--gray-3)] rounded-[var(--radius-2)] transition-colors"
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
                <span className="text-[length:var(--font-size-3)] font-medium text-[var(--gray-12)] min-w-[150px] text-center">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
                    )
                  }
                  className="p-2 hover:bg-[var(--gray-3)] rounded-[var(--radius-2)] transition-colors"
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
            <div className="grid grid-cols-7 gap-[var(--space-1)]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div
                  key={day}
                  className="text-center text-[length:var(--font-size-1)] font-semibold text-[var(--gray-11)] py-[var(--space-2)]"
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
                    className={`aspect-square p-[var(--space-2)] rounded-[var(--radius-2)] text-center text-[length:var(--font-size-2)] border transition-colors ${
                      isBlocked
                        ? 'bg-[var(--red-3)] border-[var(--red-6)] text-[var(--red-11)]'
                        : !isWorking
                          ? 'bg-[var(--gray-3)] border-[var(--gray-6)] text-[var(--gray-9)]'
                          : 'bg-[var(--gray-2)] border-[var(--gray-5)] text-[var(--gray-12)]'
                    } ${isToday ? 'ring-2 ring-[var(--accent-8)]' : ''}`}
                  >
                    <div className="font-medium">{date.getDate()}</div>
                    {isBlocked && (
                      <div className="text-[length:var(--font-size-1)] mt-0.5">Blocked</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-[var(--space-4)] flex items-center space-x-[var(--space-6)] text-[length:var(--font-size-2)]">
              <div className="flex items-center space-x-[var(--space-2)]">
                <div className="w-4 h-4 rounded-[var(--radius-1)] bg-[var(--gray-2)] border border-[var(--gray-5)]"></div>
                <span className="text-[var(--gray-11)]">Working Day</span>
              </div>
              <div className="flex items-center space-x-[var(--space-2)]">
                <div className="w-4 h-4 rounded-[var(--radius-1)] bg-[var(--gray-3)] border border-[var(--gray-6)]"></div>
                <span className="text-[var(--gray-11)]">Day Off</span>
              </div>
              <div className="flex items-center space-x-[var(--space-2)]">
                <div className="w-4 h-4 rounded-[var(--radius-1)] bg-[var(--red-3)] border border-[var(--red-6)]"></div>
                <span className="text-[var(--gray-11)]">Blocked Date</span>
              </div>
            </div>
          </div>

          {/* Blocked Dates List */}
          {selectedStylist.blockedDates.length > 0 && (
            <div>
              <h4 className="text-[length:var(--font-size-3)] font-semibold text-[var(--gray-12)] mb-[var(--space-3)]">
                Upcoming Blocked Dates
              </h4>
              <div className="space-y-[var(--space-2)]">
                {selectedStylist.blockedDates
                  .filter(date => date >= new Date().toISOString().split('T')[0])
                  .sort()
                  .slice(0, 5)
                  .map(date => (
                    <div
                      key={date}
                      className="flex items-center space-x-[var(--space-3)] p-[var(--space-3)] bg-[var(--red-3)] border border-[var(--red-6)] rounded-[var(--radius-2)]"
                    >
                      <svg
                        className="w-5 h-5 text-[var(--red-11)]"
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
                      <span className="text-[length:var(--font-size-2)] font-medium text-[var(--gray-12)]">
                        {formatDisplayDate(new Date(date))}
                      </span>
                      <span className="text-[length:var(--font-size-1)] text-[var(--gray-11)]">
                        ({date})
                      </span>
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

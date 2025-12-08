import { useState } from 'react';
import { useFormatter } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import type { BlockedPeriod } from '@/types';

interface ClosuresSettingsProps {
  closures: BlockedPeriod[];
  onChange: (closures: BlockedPeriod[]) => void;
}

// Generate time options from 6:00 to 23:00 in 30-minute increments
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 6; hour <= 23; hour++) {
    for (const min of ['00', '30']) {
      times.push(`${hour.toString().padStart(2, '0')}:${min}`);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

export default function ClosuresSettings({ closures, onChange }: ClosuresSettingsProps) {
  const format = useFormatter();
  const [newDate, setNewDate] = useState('');
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [reason, setReason] = useState('');

  // Format date for display
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format.dateTime(dateObj, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleAddClosure = () => {
    if (!newDate) return;

    // Check if date already exists as full-day closure
    const existingFullDay = closures.find(c => c.date === newDate && c.isFullDay);
    if (existingFullDay) {
      alert('This date already has a full-day closure.');
      return;
    }

    const newClosure: BlockedPeriod = {
      date: newDate,
      isFullDay,
      startTime: isFullDay ? undefined : startTime,
      endTime: isFullDay ? undefined : endTime,
      reason: reason.trim() || undefined,
    };

    onChange([...closures, newClosure].sort((a, b) => a.date.localeCompare(b.date)));

    // Reset form
    setNewDate('');
    setIsFullDay(true);
    setStartTime('09:00');
    setEndTime('12:00');
    setReason('');
  };

  const handleRemoveClosure = (closure: BlockedPeriod) => {
    onChange(
      closures.filter(
        c =>
          !(
            c.date === closure.date &&
            c.isFullDay === closure.isFullDay &&
            c.startTime === closure.startTime &&
            c.endTime === closure.endTime
          ),
      ),
    );
  };

  const today = new Date().toISOString().split('T')[0];
  const sortedClosures = [...closures].sort((a, b) => a.date.localeCompare(b.date));
  const upcomingClosures = sortedClosures.filter(c => c.date >= today);
  const pastClosures = sortedClosures.filter(c => c.date < today);

  const formatClosure = (closure: BlockedPeriod) => {
    if (closure.isFullDay) {
      return 'Full Day';
    }
    return `${closure.startTime} - ${closure.endTime}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Special Closures</h3>
        <p className="text-sm text-muted-foreground">
          Mark specific dates when the salon will be closed. You can close for the full day or
          specific hours.
        </p>
      </div>

      {/* Add New Closure */}
      <div className="bg-muted border border-border rounded-lg p-4 space-y-4">
        <label className="block text-sm font-medium text-foreground">Add Closure</label>

        {/* Date Input */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Date</label>
          <input
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            min={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Full Day Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={isFullDay} onCheckedChange={checked => setIsFullDay(!!checked)} />
          <span className="text-sm font-medium">Full Day Closure</span>
        </label>

        {/* Time Range (only shown for partial day) */}
        {!isFullDay && (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">From</label>
              <select
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {timeOptions.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-gray-500 pt-5">to</span>
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">To</label>
              <select
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {timeOptions.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Reason (optional) */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g., Staff meeting, Holiday"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          onClick={handleAddClosure}
          disabled={!newDate}
          className="w-full px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          Add Closure
        </button>
      </div>

      {/* Upcoming Closures */}
      {upcomingClosures.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Upcoming Closures ({upcomingClosures.length})
          </h4>
          <div className="space-y-2">
            {upcomingClosures.map((closure, index) => (
              <div
                key={`${closure.date}-${index}`}
                className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/30 rounded-md"
              >
                <div className="flex items-center gap-3">
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
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {formatDate(new Date(closure.date))}
                      <span className="ml-2 text-xs text-muted-foreground">({closure.date})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatClosure(closure)}
                      {closure.reason && <span className="ml-2 italic">— {closure.reason}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveClosure(closure)}
                  className="text-sm text-destructive hover:text-destructive/80 font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Closures */}
      {pastClosures.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors list-none">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 transition-transform group-open:rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span>Past Closures ({pastClosures.length})</span>
            </div>
          </summary>
          <div className="mt-3 space-y-2">
            {pastClosures.map((closure, index) => (
              <div
                key={`${closure.date}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-100 border border-border rounded-md opacity-60"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(new Date(closure.date))}
                      <span className="ml-2 text-xs text-gray-500">({closure.date})</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatClosure(closure)}
                      {closure.reason && <span className="ml-2 italic">— {closure.reason}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveClosure(closure)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Empty State */}
      {closures.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            No closure dates scheduled
          </p>
          <p className="text-sm text-gray-500">
            Add dates when your salon will be closed for holidays or special events.
          </p>
        </div>
      )}
    </div>
  );
}

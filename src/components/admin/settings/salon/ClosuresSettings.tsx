import { useState } from 'react';
import { formatDisplayDate } from '@/lib/timeUtils';

interface ClosuresSettingsProps {
  closedDates: string[];
  onChange: (dates: string[]) => void;
}

export default function ClosuresSettings({ closedDates, onChange }: ClosuresSettingsProps) {
  const [newClosedDate, setNewClosedDate] = useState('');

  const handleAddClosedDate = () => {
    if (newClosedDate && !closedDates.includes(newClosedDate)) {
      onChange([...closedDates, newClosedDate].sort());
      setNewClosedDate('');
    }
  };

  const handleRemoveClosedDate = (date: string) => {
    onChange(closedDates.filter(d => d !== date));
  };

  const sortedClosedDates = [...closedDates].sort();
  const today = new Date().toISOString().split('T')[0];
  const upcomingDates = sortedClosedDates.filter(date => date >= today);
  const pastDates = sortedClosedDates.filter(date => date < today);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-[2]">Special Closures</h3>
        <p className="text-sm text-muted-foreground">
          Mark specific dates when the salon will be closed for holidays, events, or maintenance.
          These override normal business hours.
        </p>
      </div>

      {/* Add New Closure Date */}
      <div className="bg-muted border border-border rounded-lg p-4">
        <label className="block text-[length:var(--font-size-3)] font-medium text-foreground mb-[3]">
          Add Closure Date
        </label>
        <div className="flex gap-[3]">
          <input
            type="date"
            value={newClosedDate}
            onChange={e => setNewClosedDate(e.target.value)}
            min={today}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent hover:border-gray-400 transition-colors"
          />
          <button
            onClick={handleAddClosedDate}
            disabled={!newClosedDate}
            className="px-[4] py-2 bg-accent text-white rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Add Date
          </button>
        </div>
      </div>

      {/* Upcoming Closures */}
      {upcomingDates.length > 0 && (
        <div>
          <h4 className="text-[length:var(--font-size-3)] font-semibold text-foreground mb-[3]">
            Upcoming Closures ({upcomingDates.length})
          </h4>
          <div className="space-y-[2]">
            {upcomingDates.map(date => (
              <div
                key={date}
                className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive rounded-md hover:border-destructive/80 transition-colors"
              >
                <div className="flex items-center space-x-[3]">
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
                    <span className="text-[length:var(--font-size-3)] font-medium text-foreground">
                      {formatDisplayDate(new Date(date))}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">({date})</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveClosedDate(date)}
                  className="text-sm text-destructive hover:text-destructive/90 font-medium transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Closures */}
      {pastDates.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-[length:var(--font-size-3)] font-semibold text-muted-foreground hover:text-foreground transition-colors list-none">
            <div className="flex items-center space-x-[2]">
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
              <span>Past Closures ({pastDates.length})</span>
            </div>
          </summary>
          <div className="mt-[3] space-y-[2]">
            {pastDates.map(date => (
              <div
                key={date}
                className="flex items-center justify-between p-[3] bg-gray-100 border border-border rounded-md opacity-60"
              >
                <div className="flex items-center space-x-[3]">
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
                    <span className="text-[length:var(--font-size-3)] text-muted-foreground">
                      {formatDisplayDate(new Date(date))}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">({date})</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveClosedDate(date)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Empty State */}
      {closedDates.length === 0 && (
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-[length:var(--font-size-3)] font-medium text-muted-foreground mb-1">
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

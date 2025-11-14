import * as Checkbox from '@radix-ui/react-checkbox';
import type { AdminSettings } from '@/types';

interface ScheduleSettingsProps {
  weeklySchedule: AdminSettings['weeklySchedule'];
  onChange: (schedule: AdminSettings['weeklySchedule']) => void;
}

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export default function ScheduleSettings({ weeklySchedule, onChange }: ScheduleSettingsProps) {
  const handleDayToggle = (day: keyof AdminSettings['weeklySchedule'], isOpen: boolean) => {
    onChange({
      ...weeklySchedule,
      [day]: { ...weeklySchedule[day], isOpen },
    });
  };

  const handleTimeChange = (
    day: keyof AdminSettings['weeklySchedule'],
    field: 'openingTime' | 'closingTime',
    value: string,
  ) => {
    onChange({
      ...weeklySchedule,
      [day]: { ...weeklySchedule[day], [field]: value },
    });
  };

  return (
    <div className="space-y-[var(--space-6)]">
      <div>
        <h3 className="text-[length:var(--font-size-5)] font-bold text-[var(--gray-12)] mb-[var(--space-2)]">
          Default Business Hours
        </h3>
        <p className="text-[length:var(--font-size-2)] text-[var(--gray-11)]">
          Set your salon&apos;s standard operating hours. These apply salon-wide unless overridden
          by stylist-specific schedules.
        </p>
      </div>

      <div className="space-y-[var(--space-3)]">
        {DAYS.map(day => {
          const schedule = weeklySchedule?.[day] || {
            isOpen: true,
            openingTime: '09:00',
            closingTime: '17:00',
          };
          return (
            <div
              key={day}
              className="flex items-center justify-between p-[var(--space-4)] bg-[var(--gray-2)] border border-[var(--gray-6)] rounded-[var(--radius-3)] hover:border-[var(--gray-7)] transition-colors"
            >
              <div className="flex items-center space-x-[var(--space-3)] flex-1">
                <label className="flex items-center space-x-[var(--space-3)] cursor-pointer min-w-[140px]">
                  <Checkbox.Root
                    checked={schedule.isOpen}
                    onCheckedChange={checked => handleDayToggle(day, checked === true)}
                    className="flex items-center justify-center w-5 h-5 rounded-[var(--radius-1)] border border-[var(--gray-7)] bg-[var(--color-surface)] hover:border-[var(--gray-8)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] data-[state=checked]:bg-accent data-[state=checked]:border-[var(--accent-9)]"
                  >
                    <Checkbox.Indicator>
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="text-[length:var(--font-size-3)] font-medium text-[var(--gray-12)] capitalize">
                    {day}
                  </span>
                </label>

                {schedule.isOpen ? (
                  <div className="flex items-center space-x-[var(--space-2)] flex-1">
                    <input
                      type="time"
                      value={schedule.openingTime}
                      onChange={e => handleTimeChange(day, 'openingTime', e.target.value)}
                      className="px-[var(--space-3)] py-[var(--space-2)] border border-[var(--gray-7)] rounded-[var(--radius-2)] text-[length:var(--font-size-2)] bg-[var(--color-surface)] text-[var(--gray-12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] focus-visible:border-[var(--accent-8)] hover:border-[var(--gray-8)] transition-colors"
                    />
                    <span className="text-[var(--gray-11)]">to</span>
                    <input
                      type="time"
                      value={schedule.closingTime}
                      onChange={e => handleTimeChange(day, 'closingTime', e.target.value)}
                      className="px-[var(--space-3)] py-[var(--space-2)] border border-[var(--gray-7)] rounded-[var(--radius-2)] text-[length:var(--font-size-2)] bg-[var(--color-surface)] text-[var(--gray-12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] focus-visible:border-[var(--accent-8)] hover:border-[var(--gray-8)] transition-colors"
                    />
                  </div>
                ) : (
                  <span className="text-[length:var(--font-size-2)] text-[var(--gray-11)] italic">
                    Closed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-[var(--space-4)] bg-[var(--blue-3)] border border-[var(--blue-6)] rounded-[var(--radius-3)]">
        <div className="flex items-start space-x-[var(--space-3)]">
          <svg
            className="w-5 h-5 text-[var(--blue-11)] flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-[length:var(--font-size-2)] text-[var(--gray-12)]">
            <p className="font-medium mb-1">About Default Hours</p>
            <p className="text-[var(--gray-11)]">
              These hours serve as the baseline for appointment booking. Individual stylists can
              have their own schedules that override these defaults. Manage stylist-specific hours
              in the <strong>Stylists</strong> tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

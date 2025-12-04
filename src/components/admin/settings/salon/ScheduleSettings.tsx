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
  // Helper to ensure all days exist in schedule
  const getCompleteSchedule = (): AdminSettings['weeklySchedule'] => {
    const defaultDay = { isOpen: true, openingTime: '09:00', closingTime: '17:00' };
    const complete = {} as AdminSettings['weeklySchedule'];

    DAYS.forEach(day => {
      complete[day] = weeklySchedule?.[day] || defaultDay;
    });

    return complete;
  };

  const handleDayToggle = (day: keyof AdminSettings['weeklySchedule'], isOpen: boolean) => {
    const completeSchedule = getCompleteSchedule();
    onChange({
      ...completeSchedule,
      [day]: { ...completeSchedule[day], isOpen },
    });
  };

  const handleTimeChange = (
    day: keyof AdminSettings['weeklySchedule'],
    field: 'openingTime' | 'closingTime',
    value: string,
  ) => {
    const completeSchedule = getCompleteSchedule();
    onChange({
      ...completeSchedule,
      [day]: { ...completeSchedule[day], [field]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-[2]">Default Business Hours</h3>
        <p className="text-sm text-muted-foreground">
          Set your salon&apos;s standard operating hours. These apply salon-wide unless overridden
          by stylist-specific schedules.
        </p>
      </div>

      <div className="space-y-[3]">
        {DAYS.map(day => {
          const schedule = weeklySchedule?.[day] || {
            isOpen: true,
            openingTime: '09:00',
            closingTime: '17:00',
          };
          return (
            <div
              key={day}
              className="flex items-center justify-between p-4 bg-muted border border-border rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center space-x-[3] flex-1">
                <label className="flex items-center space-x-[3] cursor-pointer min-w-[140px]">
                  <Checkbox.Root
                    checked={schedule.isOpen}
                    onCheckedChange={checked => handleDayToggle(day, checked === true)}
                    className="flex items-center justify-center w-5 h-5 rounded-sm border border-gray-300 bg-background hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent data-[state=checked]:bg-accent data-[state=checked]:border-[hsl(var(--accent))]"
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
                  <span className="text-[length:var(--font-size-3)] font-medium text-foreground capitalize">
                    {day}
                  </span>
                </label>

                {schedule.isOpen ? (
                  <div className="flex items-center space-x-[2] flex-1">
                    <input
                      type="time"
                      value={schedule.openingTime || '09:00'}
                      onChange={e => handleTimeChange(day, 'openingTime', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent hover:border-gray-400 transition-colors"
                    />
                    <span className="text-muted-foreground">to</span>
                    <input
                      type="time"
                      value={schedule.closingTime || '17:00'}
                      onChange={e => handleTimeChange(day, 'closingTime', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent hover:border-gray-400 transition-colors"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Closed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-500 rounded-lg">
        <div className="flex items-start space-x-[3]">
          <svg
            className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5"
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
          <div className="text-sm text-foreground">
            <p className="font-medium mb-1">About Default Hours</p>
            <p className="text-muted-foreground">
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

import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import type { AdminSettings } from '@/types';

interface WeeklyScheduleProps {
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

export default function WeeklySchedule({ weeklySchedule, onChange }: WeeklyScheduleProps) {
  const t = useTranslations('Admin.Availability');
  const tCommon = useTranslations('Common');

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
        <h3 className="text-lg font-bold text-foreground mb-2">{t('defaultBusinessHours')}</h3>
        <p className="text-sm text-muted-foreground">{t('defaultBusinessHoursDesc')}</p>
      </div>

      <div className="border border-gray-200 rounded-md p-3 space-y-2 bg-muted/30">
        {DAYS.map(day => {
          const schedule = weeklySchedule?.[day] || {
            isOpen: true,
            openingTime: '09:00',
            closingTime: '17:00',
          };
          return (
            <div
              key={day}
              className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
            >
              <div className="w-24 shrink-0">
                <label className="flex items-center cursor-pointer">
                  <Checkbox
                    checked={schedule.isOpen}
                    onCheckedChange={checked => handleDayToggle(day, checked === true)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">{tCommon(`days.${day}`)}</span>
                </label>
              </div>
              {schedule.isOpen ? (
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={schedule.openingTime || '09:00'}
                    onChange={e => handleTimeChange(day, 'openingTime', e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {timeOptions.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-500">{t('to')}</span>
                  <select
                    value={schedule.closingTime || '17:00'}
                    onChange={e => handleTimeChange(day, 'closingTime', e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {timeOptions.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">{t('closed')}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
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
            <p className="font-medium mb-1">{t('aboutDefaultHours')}</p>
            <p className="text-muted-foreground">{t('aboutDefaultHoursDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

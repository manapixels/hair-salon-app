'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { groupSlotsByPeriod } from '@/lib/timeUtils';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotListProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  loading?: boolean;
  isAnimatingSelection?: boolean;
}

const SunIcon = () => (
  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
      clipRule="evenodd"
    />
  </svg>
);

const CloudIcon = () => (
  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
  </svg>
);

interface TimeSlotGroupProps {
  title: string;
  icon: React.ReactNode;
  slots: TimeSlot[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  isAnimatingSelection?: boolean;
}

const TimeSlotGroup: React.FC<TimeSlotGroupProps> = ({
  title,
  icon,
  slots,
  selectedTime,
  onTimeSelect,
  isAnimatingSelection = false,
}) => {
  if (slots.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
        {icon}
        <span>{title}</span>
        <span className="text-gray-400">({slots.length})</span>
      </div>

      <div className="space-y-2">
        {slots.map(({ time, available }) => {
          const isSelected = selectedTime === time;

          return (
            <button
              key={time}
              role="radio"
              aria-checked={isSelected}
              disabled={!available}
              onClick={() => available && onTimeSelect(time)}
              className={`
                w-full text-left px-5 py-4 md:px-4 md:py-3.5 rounded-lg font-medium
                border-2 bg-white transition-all duration-200
                min-h-touch-lg
                ${available ? 'active-scale' : ''}
                ${
                  isSelected
                    ? 'border-primary bg-stone-100 text-gray-900 shadow-md'
                    : 'border-gray-200 text-gray-900 hover:border-primary hover:bg-primary/10 hover:shadow-sm active:border-primary active:bg-primary/5'
                }
                ${!available ? 'opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-transparent hover:shadow-none' : 'cursor-pointer'}
                ${isSelected && isAnimatingSelection ? 'animate-pulse-selection motion-reduce:animate-none' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <span>{time}</span>
                {isSelected && (
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const TimeSlotList: React.FC<TimeSlotListProps> = ({
  slots,
  selectedTime,
  onTimeSelect,
  loading = false,
  isAnimatingSelection = false,
}) => {
  const t = useTranslations('BookingForm');
  const grouped = useMemo(() => groupSlotsByPeriod(slots), [slots]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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
        <p className="mt-4 text-gray-600 font-medium">{t('noSlotsForDate')}</p>
        <p className="text-sm text-gray-500 mt-1">{t('tryDifferent')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="radiogroup" aria-label="Available time slots">
      <TimeSlotGroup
        title={t('morning')}
        icon={<SunIcon />}
        slots={grouped.morning}
        selectedTime={selectedTime}
        onTimeSelect={onTimeSelect}
        isAnimatingSelection={isAnimatingSelection}
      />

      <TimeSlotGroup
        title={t('afternoon')}
        icon={<CloudIcon />}
        slots={grouped.afternoon}
        selectedTime={selectedTime}
        onTimeSelect={onTimeSelect}
        isAnimatingSelection={isAnimatingSelection}
      />

      <TimeSlotGroup
        title={t('evening')}
        icon={<MoonIcon />}
        slots={grouped.evening}
        selectedTime={selectedTime}
        onTimeSelect={onTimeSelect}
        isAnimatingSelection={isAnimatingSelection}
      />
    </div>
  );
};

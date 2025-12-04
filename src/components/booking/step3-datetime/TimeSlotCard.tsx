import {
  calculateEndTime,
  formatDuration,
  getDurationColor,
  getDurationPercentage,
} from '@/lib/timeUtils';

export const TimeSlotCard: React.FC<{
  time: string;
  duration: number;
  isSelected: boolean;
  isAvailable: boolean;
  onClick: () => void;
}> = ({ time, duration, isSelected, isAvailable, onClick }) => {
  const endTime = calculateEndTime(time, duration);
  const durationText = formatDuration(duration);

  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={onClick}
      className={`
        relative p-4 rounded-lg text-left transition-all duration-200 h-auto w-full
        ${
          isSelected
            ? 'bg-primary ring-2 ring-primary shadow-lg scale-105'
            : isAvailable
              ? 'bg-white border-2 border-gray-200 hover:border-primary hover:shadow-md'
              : 'bg-gray-50 border border-gray-200 opacity-50 cursor-not-allowed'
        }
      `}
      aria-label={`${time} to ${endTime}, ${durationText}`}
      aria-pressed={isSelected}
    >
      <div className="flex flex-col gap-1">
        {/* Start time - prominent */}
        <span className="text-sm font-bold">{time}</span>

        {/* Duration bar */}
        <div
          className={`mb-1 rounded-full h-1.5 overflow-hidden ${
            isSelected ? 'bg-primary/10' : 'bg-gray-200'
          }`}
        >
          <div
            className={`h-full transition-all ${
              isSelected ? 'bg-white' : getDurationColor(duration)
            }`}
            style={{ width: `${getDurationPercentage(duration)}%` }}
          />
        </div>

        {/* End time */}
        <span className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
          to {endTime}
        </span>

        {/* Duration label */}
        <div
          className={`flex items-center gap-1 text-xs ${
            isSelected ? 'text-white/80' : 'text-gray-500'
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{durationText}</span>
        </div>
      </div>
    </button>
  );
};

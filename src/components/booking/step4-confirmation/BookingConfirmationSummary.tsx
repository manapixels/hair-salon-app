import React from 'react';
import { User, Calendar, Clock, Scissors } from 'lucide-react';
import { Stylist, ServiceCategory } from '@/types';
import { getDurationParts } from '@/lib/timeUtils';
import { useTranslations, useFormatter } from 'next-intl';

interface BookingConfirmationSummaryProps {
  selectedCategory?: ServiceCategory | null;
  selectedStylist: Stylist | null;
  selectedDate: Date;
  selectedTime: string;
  totalDuration: number;
  timezone?: string;
  onClose?: () => void;
}

export const BookingConfirmationSummary: React.FC<BookingConfirmationSummaryProps> = ({
  selectedCategory,
  selectedStylist,
  selectedDate,
  selectedTime,
  totalDuration,
  timezone = 'Asia/Singapore',
  onClose,
}) => {
  const t = useTranslations('BookingForm');
  const tNav = useTranslations('Navigation');
  const format = useFormatter();

  // Get translated category name using slug, fallback to database title
  const displayText = selectedCategory
    ? tNav(`serviceNames.${selectedCategory.slug}`, { default: selectedCategory.title })
    : t('noServiceSelected');

  // Format duration using translation keys
  const { hours, mins } = getDurationParts(totalDuration);
  const durationText =
    hours === 0
      ? t('durationMinutesOnly', { minutes: mins })
      : mins === 0
        ? t('durationHoursOnly', { hours })
        : t('durationHoursMinutes', { hours, minutes: mins });

  // Format date and time using useFormatter for i18n with explicit timezone
  // This prevents SSR issues on Cloudflare edge servers (UTC)
  const formattedDate = format.dateTime(selectedDate, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: timezone,
  });

  // Parse time string (HH:MM format) and format it with explicit timezone
  const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format.dateTime(date, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone, // Always display in salon timezone
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="divide-y divide-gray-50">
        {/* Service/Category */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/50">
          <Scissors className="w-5 h-5 text-gray-500" />
          <div className="text-sm">
            <span className="text-gray-500 mr-2">{t('serviceCategory')}</span>
            <span className="font-medium text-gray-900">{displayText}</span>
          </div>
        </div>

        {/* Stylist */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/50">
          <User className="w-5 h-5 text-gray-500" />
          <div className="text-sm">
            <span className="text-gray-500 mr-2">{t('with')}</span>
            <span className="font-medium text-gray-900">
              {selectedStylist ? selectedStylist.name : t('anyAvailableStylist')}
            </span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/50">
          <Calendar className="w-5 h-5 text-gray-500" />
          <div className="text-sm">
            <span className="text-gray-500 mr-2">{t('when')}</span>
            <span className="font-medium text-gray-900">
              {formattedDate}, {formatTime(selectedTime)}
            </span>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/50">
          <Clock className="w-5 h-5 text-gray-500" />
          <div className="text-sm">
            <span className="text-gray-500 mr-2">{t('duration')}</span>
            <span className="font-medium text-gray-900">{durationText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

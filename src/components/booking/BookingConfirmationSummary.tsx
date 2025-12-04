import React from 'react';
import { User, Calendar, Clock, X, Scissors } from 'lucide-react';
import { Service, Stylist, ServiceCategory } from '@/types';
import { formatShortDate, formatTimeDisplay } from '@/lib/timeUtils';
import { useTranslations } from 'next-intl';

interface BookingConfirmationSummaryProps {
  selectedServices?: Service[]; // Optional for backward compatibility
  selectedCategory?: ServiceCategory | null; // NEW: Category-based booking
  selectedStylist: Stylist | null;
  selectedDate: Date;
  selectedTime: string;
  totalDuration: number;
  timezone?: string;
  onClose?: () => void;
}

export const BookingConfirmationSummary: React.FC<BookingConfirmationSummaryProps> = ({
  selectedServices,
  selectedCategory,
  selectedStylist,
  selectedDate,
  selectedTime,
  totalDuration,
  timezone = 'Asia/Singapore',
  onClose,
}) => {
  const t = useTranslations('BookingForm');
  // Determine display based on booking type
  const displayText = selectedCategory
    ? selectedCategory.title
    : selectedServices && selectedServices.length > 0
      ? selectedServices.map(s => s.name).join(', ')
      : t('noServiceSelected');

  const isCategoryBased = Boolean(selectedCategory);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="divide-y divide-gray-50">
        {/* Service/Category */}
        <div className="flex items-center gap-3 p-4 bg-gray-50/50">
          <Scissors className="w-5 h-5 text-gray-500" />
          <div className="text-sm">
            <span className="text-gray-500 mr-2">
              {isCategoryBased ? t('serviceCategory') : t('services')}
            </span>
            <span className="font-medium text-gray-900">{displayText}</span>
          </div>
        </div>

        {/* Stylist */}
        <div className="flex items-center gap-3 p-4 bg-gray-50/50">
          <User className="w-5 h-5 text-gray-500" />
          <div className="text-sm">
            <span className="text-gray-500 mr-2">{t('with')}</span>
            <span className="font-medium text-gray-900">
              {selectedStylist ? selectedStylist.name : t('anyAvailableStylist')}
            </span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-3 p-4 bg-gray-50/50">
          <Calendar className="w-5 h-5 text-gray-500" />
          <div className="text-sm">
            <span className="text-gray-500 mr-2">{t('when')}</span>
            <span className="font-medium text-gray-900">
              {formatShortDate(selectedDate)}, {formatTimeDisplay(selectedTime)}
            </span>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3 p-4 bg-gray-50/50">
          <Clock className="w-5 h-5 text-gray-500" />
          <div className="text-sm">
            <span className="text-gray-500 mr-2">{t('duration')}</span>
            <span className="font-medium text-gray-900">
              {totalDuration} {t('minutes')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

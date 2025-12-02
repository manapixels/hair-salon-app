import React from 'react';
import { format } from 'date-fns';
import { User, Calendar, Clock, X } from 'lucide-react';
import { Service, Stylist } from '@/types';
import { BookingCategory } from '@/data/bookingCategories';

interface BookingConfirmationSummaryProps {
  selectedServices?: Service[]; // Optional for backward compatibility
  selectedCategory?: BookingCategory | null; // NEW: Category-based booking
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
  // Determine display based on booking type
  const displayText = selectedCategory
    ? selectedCategory.title
    : selectedServices && selectedServices.length > 0
      ? selectedServices.map(s => s.name).join(', ')
      : 'No service selected';

  const isCategoryBased = Boolean(selectedCategory);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
        {/* Service/Category */}
        <div className="flex items-center gap-3 p-4 bg-gray-50/50 dark:bg-gray-800/50">
          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400 mr-2">
              {isCategoryBased ? 'Service Category:' : 'Services:'}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">{displayText}</span>
          </div>
        </div>

        {/* Disclaimer for category-based booking */}
        {isCategoryBased && (
          <div className="px-4 py-3 bg-blue-50/50 dark:bg-blue-900/20">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Specific service details and pricing will be confirmed during your appointment.
            </p>
          </div>
        )}

        {/* Stylist */}
        <div className="flex items-center gap-3 p-4 bg-gray-50/50 dark:bg-gray-800/50">
          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400 mr-2">With:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedStylist ? selectedStylist.name : 'Any Available Stylist'}
            </span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-3 p-4 bg-gray-50/50 dark:bg-gray-800/50">
          <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400 mr-2">When:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
            </span>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3 p-4 bg-gray-50/50 dark:bg-gray-800/50">
          <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400 mr-2">Duration:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {totalDuration} minutes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

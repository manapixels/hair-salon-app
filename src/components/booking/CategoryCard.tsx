'use client';

import { Check } from '@/lib/icons';
import type { BookingCategory } from '@/data/bookingCategories';

interface CategoryCardProps {
  category: BookingCategory;
  isSelected: boolean;
  onClick: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, isSelected, onClick }) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${category.title}: ${category.description}`}
      onClick={onClick}
      className={`
        relative w-full text-left p-5 rounded-lg border-2 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
        ${
          isSelected
            ? 'border-accent bg-accent/5 dark:bg-accent/10'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Category Title */}
          <h3
            className={`text-lg font-semibold mb-1 ${
              isSelected ? 'text-accent dark:text-accent' : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {category.title}
          </h3>

          {/* Category Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{category.description}</p>

          {/* Price Note (only for Haircut) */}
          {category.priceNote && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
              {category.priceNote}
            </p>
          )}
        </div>

        {/* Checkmark (Selected State) */}
        {isSelected && (
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full bg-accent shrink-0"
            aria-hidden="true"
          >
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
    </button>
  );
};

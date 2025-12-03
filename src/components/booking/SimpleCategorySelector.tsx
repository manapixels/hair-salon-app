'use client';

import { useEffect, useRef } from 'react';
import { BOOKING_CATEGORIES, type BookingCategory } from '@/data/bookingCategories';
import { CategoryCard } from './CategoryCard';
import { LoadingSpinner } from '../feedback/loaders/LoadingSpinner';

interface SimpleCategorySelectorProps {
  selectedCategory: BookingCategory | null;
  onCategorySelect: (category: BookingCategory) => void;
}

export const SimpleCategorySelector: React.FC<SimpleCategorySelectorProps> = ({
  selectedCategory,
  onCategorySelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus first category on mount for keyboard navigation
  useEffect(() => {
    if (containerRef.current) {
      const firstButton = containerRef.current.querySelector('button');
      firstButton?.focus();
    }
  }, []);

  return (
    <div id="service-selector" className="space-y-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        1. Select Service Category
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Choose the type of service you&apos;d like to book. Specific service details will be
        confirmed with your stylist during the appointment.
      </p>

      <div
        ref={containerRef}
        role="radiogroup"
        aria-label="Service categories"
        className="max-w-2xl grid grid-cols-3 gap-4 md:gap-8 bg-white p-4"
      >
        {BOOKING_CATEGORIES.map((category, index) => (
          <CategoryCard
            category={category}
            isSelected={selectedCategory?.id === category.id}
            onClick={() => onCategorySelect(category)}
            key={category.id}
          />
        ))}
      </div>

      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {selectedCategory
          ? `${selectedCategory.title} category selected. Proceeding to stylist selection.`
          : 'No category selected'}
      </div>
    </div>
  );
};

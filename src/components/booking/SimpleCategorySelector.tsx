'use client';

import { useEffect, useRef } from 'react';
import { BOOKING_CATEGORIES, type BookingCategory } from '@/data/bookingCategories';
import { CategoryCard } from './CategoryCard';
import { LoadingSpinner } from '../feedback/loaders/LoadingSpinner';

interface SimpleCategorySelectorProps {
  selectedCategory: BookingCategory | null;
  onCategorySelect: (category: BookingCategory) => void;
  loading?: boolean;
}

export const SimpleCategorySelector: React.FC<SimpleCategorySelectorProps> = ({
  selectedCategory,
  onCategorySelect,
  loading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus first category on mount for keyboard navigation
  useEffect(() => {
    if (!loading && containerRef.current) {
      const firstButton = containerRef.current.querySelector('button');
      firstButton?.focus();
    }
  }, [loading]);

  // Keyboard navigation (Arrow keys)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const categories = BOOKING_CATEGORIES;
    let nextIndex = index;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (index + 1) % categories.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (index - 1 + categories.length) % categories.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = categories.length - 1;
    } else {
      return; // Exit if not an arrow key
    }

    // Focus next/previous card
    const buttons = containerRef.current?.querySelectorAll('button');
    buttons?.[nextIndex]?.focus();
  };

  if (loading) {
    return (
      <div id="service-selector" className="space-y-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          1. Select Service Category
        </h2>
        <div className="flex justify-center p-8">
          <LoadingSpinner message="Loading service categories..." />
        </div>
      </div>
    );
  }

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
        className="space-y-3 max-w-2xl"
      >
        {BOOKING_CATEGORIES.map((category, index) => (
          <div key={category.id} onKeyDown={e => handleKeyDown(e, index)}>
            <CategoryCard
              category={category}
              isSelected={selectedCategory?.id === category.id}
              onClick={() => onCategorySelect(category)}
            />
          </div>
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

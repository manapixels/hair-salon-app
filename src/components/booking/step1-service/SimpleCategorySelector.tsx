'use client';

import { useEffect, useRef } from 'react';
import type { ServiceCategory } from '@/types';
import { CategoryCard } from './CategoryCard';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { useBookingModal } from '@/context/BookingModalContext';
import { useTranslations } from 'next-intl';

interface SimpleCategorySelectorProps {
  selectedCategory: ServiceCategory | null;
  onCategorySelect: (category: ServiceCategory) => void;
}

export const SimpleCategorySelector: React.FC<SimpleCategorySelectorProps> = ({
  selectedCategory,
  onCategorySelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { bookingCategories } = useBookingModal();
  const t = useTranslations('BookingForm');

  // Auto-focus first category on mount for keyboard navigation
  useEffect(() => {
    if (containerRef.current) {
      const firstButton = containerRef.current.querySelector('button');
      firstButton?.focus();
    }
  }, []);

  return (
    <div id="service-selector" className="space-y-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('step1')}</h2>

      <p className="text-sm text-gray-600 mb-6">{t('chooseCategoryDesc')}</p>

      <div
        ref={containerRef}
        role="radiogroup"
        aria-label={t('serviceCategories')}
        className="max-w-2xl grid grid-cols-3 gap-4 md:gap-8 bg-white p-4"
      >
        {bookingCategories.map((category, index) => (
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
          ? `${selectedCategory.title} ${t('categorySelected')}`
          : t('noCategorySelected')}
      </div>
    </div>
  );
};

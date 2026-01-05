'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

import type { ServiceCategory } from '@/types';
import { CategoryCard } from './CategoryCard';
import { useBookingModal } from '@/context/BookingModalContext';
import { StepHeader } from '@/components/booking/shared/StepHeader';

interface SimpleCategorySelectorProps {
  selectedCategory: ServiceCategory | null;
  onCategorySelect: (category: ServiceCategory) => void;
  isPreSelectionAnimating?: boolean;
}

export const SimpleCategorySelector: React.FC<SimpleCategorySelectorProps> = ({
  selectedCategory,
  onCategorySelect,
  isPreSelectionAnimating = false,
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
      <StepHeader title={t('step1')} />

      <p className="text-sm text-gray-600 mb-6 px-4 sm:px-6">{t('chooseCategoryDesc')}</p>

      <div
        ref={containerRef}
        role="radiogroup"
        aria-label={t('serviceCategories')}
        className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 bg-white p-4 mx-4 sm:mx-6"
      >
        {bookingCategories.map((category, index) => (
          <CategoryCard
            category={category}
            isSelected={selectedCategory?.id === category.id}
            isAnimatingSelection={isPreSelectionAnimating && selectedCategory?.id === category.id}
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

'use client';

import { Check } from '@/lib/icons';
import type { ServiceCategory } from '@/types';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface CategoryCardProps {
  category: ServiceCategory;
  isSelected: boolean;
  onClick: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, isSelected, onClick }) => {
  const t = useTranslations('Navigation');

  // Get translated name, fallback to database title if translation doesn't exist
  const categoryName = t(`serviceNames.${category.slug}`, { default: category.title });
  return (
    <Button
      type="button"
      variant="outline"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${categoryName}: ${category.description || ''}`}
      onClick={onClick}
      className={`
        relative h-auto text-left px-5 py-2 flex flex-col items-center justify-between gap-1 border hover:border-accent focus:ring-2 focus:ring-accent/20 whitespace-normal
        ${isSelected ? 'border-accent bg-accent/5' : 'bg-white hover:bg-gray-50'}
      `}
    >
      <div className="relative w-16 h-16 rounded-lg">
        <Image
          src={`/images/illustrations/${category.slug}.png` || ''}
          alt={categoryName}
          fill
          className="object-cover"
          sizes="128px"
        />
      </div>
      <span
        className={`text-md text-center leading-none flex-1 flex items-center justify-center w-full ${isSelected ? 'text-accent' : 'text-gray-900'}`}
      >
        {categoryName}
      </span>

      {/* Checkmark (Selected State) */}
      {isSelected && (
        <div
          className="flex items-center justify-center w-6 h-6 rounded-full bg-accent shrink-0 absolute right-2 top-2"
          aria-hidden="true"
        >
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
    </Button>
  );
};

'use client';

import { Check } from '@/lib/icons';
import type { ServiceCategory } from '@/types';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: ServiceCategory;
  isSelected: boolean;
  isAnimatingSelection?: boolean;
  onClick: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected,
  isAnimatingSelection = false,
  onClick,
}) => {
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
      className={cn(
        'relative h-auto text-left px-5 py-2 flex flex-col items-center justify-between gap-1',
        'border hover:border-primary active:border-primary focus:ring-2 focus:ring-primary/20 whitespace-normal',
        'transition-all',
        isSelected
          ? 'border-primary bg-primary/5 hover:bg-primary/5'
          : 'bg-white hover:bg-gray-50 active:bg-gray-50',
        // Pulse animation for pre-selection
        isAnimatingSelection && 'animate-pulse-selection',
        'motion-reduce:animate-none motion-reduce:scale-100',
      )}
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
        className={cn(
          'text-md text-center leading-none flex-1 flex items-center justify-center w-full',
          isSelected ? 'text-primary' : 'text-gray-900',
        )}
      >
        {categoryName}
      </span>

      {/* Checkmark (Selected State) */}
      {isSelected && (
        <div
          className={cn(
            'flex items-center justify-center w-6 h-6 rounded-full bg-primary shrink-0 absolute -right-1 -top-1',
            isAnimatingSelection && 'animate-scale-in',
          )}
          aria-hidden="true"
        >
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
    </Button>
  );
};

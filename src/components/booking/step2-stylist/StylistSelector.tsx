'use client';

import React from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import { StylistCardSkeleton } from '@/components/feedback/loaders/StylistCardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useStylists } from '@/hooks/queries';
import type { Service, Stylist, ServiceCategory } from '@/types';
import { StepHeader } from '@/components/booking/shared/StepHeader';

interface StylistSelectorProps {
  selectedServices: Service[];
  selectedStylist: Stylist | null;
  onStylistSelect: (stylist: Stylist | null) => void;
  onSkip?: () => void;
  selectedCategory?: ServiceCategory | null;
  isAnimatingSelection?: boolean; // Pulse animation when a selection is made
}

export const StylistSelector: React.FC<StylistSelectorProps> = ({
  selectedServices,
  selectedStylist,
  onStylistSelect,
  onSkip,
  selectedCategory,
  isAnimatingSelection = false,
}) => {
  const t = useTranslations('BookingForm');

  // Determine if we're in category-based or service-based mode
  const isCategoryBased =
    selectedServices.length === 0 && selectedCategory !== null && selectedCategory !== undefined;

  // Use React Query hook for stylists (must be called before any early returns)
  // Filter by category specialty when in category-based mode
  const {
    data: stylists = [],
    isLoading,
    error,
    refetch,
  } = useStylists({
    categoryId: isCategoryBased ? selectedCategory?.id : undefined,
    enabled: isCategoryBased || selectedServices.length > 0,
  });

  // Delayed loading to prevent flash on fast connections (must be called before any early returns)
  const showLoader = useDelayedLoading(isLoading, { delay: 150, minDuration: 300 });

  // Don't render if neither services nor category is selected
  if (!isCategoryBased && selectedServices.length === 0) {
    return null;
  }

  // Format error message
  const errorMessage = error instanceof Error ? error.message : 'Unable to load stylists';

  return (
    <div className="scroll-mt-24" id="stylist-selector" tabIndex={-1}>
      <StepHeader title={t('step2')} />

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isLoading &&
          (isCategoryBased ? t('loadingAvailableStylists') : t('loadingStylistsForServices'))}
        {!isLoading && stylists.length > 0 && `${stylists.length} ${t('stylistsAvailable')}`}
        {!isLoading && stylists.length === 0 && t('noStylistsAvailable')}
      </div>

      <div className="px-4 pb-4">
        {showLoader || isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            <StylistCardSkeleton count={3} />
          </div>
        ) : error ? (
          <ErrorState
            title={t('failedToLoadStylists')}
            message={errorMessage}
            onRetry={() => refetch()}
            retryText={t('tryAgain')}
          />
        ) : stylists.length === 0 ? (
          <EmptyState
            icon={
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
            title={t('noStylistsTitle')}
            description={t('noStylistsDesc')}
          />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
            {/* Anyone Available Option */}
            <div
              onClick={() => onStylistSelect(null)}
              className={`
                relative shrink-0 snap-start cursor-pointer rounded-2xl border-2 transition-all duration-200
                flex flex-col items-center justify-center py-3 px-4 text-center
                ${!selectedStylist ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-primary/50'}
              `}
            >
              <div className="w-16 h-16 rounded-full bg-white border border-gray-100 flex items-center justify-center mb-3 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-stone-900 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                Anyone
                <br />
                available
              </h3>
            </div>

            {/* Stylist Cards */}
            {stylists.map(stylist => {
              const isSelected = selectedStylist?.id === stylist.id;
              return (
                <div
                  key={stylist.id}
                  onClick={() => onStylistSelect(stylist)}
                  className={`
                    relative shrink-0 snap-start cursor-pointer rounded-2xl border-2 transition-all duration-200
                    flex flex-col items-center justify-center py-3 px-4 text-center
                    ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-primary/50'}
                    ${isSelected && isAnimatingSelection ? 'animate-pulse' : ''}
                  `}
                >
                  {stylist.avatar ? (
                    <div className="relative w-16 h-16 mb-3">
                      <Image
                        src={stylist.avatar}
                        alt={stylist.name}
                        fill
                        className="rounded-full object-cover border border-gray-100 shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-2xl font-bold text-gray-400">
                      {stylist.name.charAt(0)}
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-gray-900 truncate w-full px-1">
                    {stylist.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate w-full px-1">
                    {stylist.role || 'Stylist'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

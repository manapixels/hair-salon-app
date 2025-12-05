'use client';

import React from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { StylistCardSkeleton } from '@/components/feedback/loaders/StylistCardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useStylists } from '@/hooks/queries';
import type { Service, Stylist, ServiceCategory } from '@/types';
import { useTranslations } from 'next-intl';

interface StylistSelectorProps {
  selectedServices: Service[];
  selectedStylist: Stylist | null;
  onStylistSelect: (stylist: Stylist | null) => void;
  onSkip?: () => void;
  selectedCategory?: ServiceCategory | null; // NEW: For category-based booking
}

export const StylistSelector: React.FC<StylistSelectorProps> = ({
  selectedServices,
  selectedStylist,
  onStylistSelect,
  onSkip,
  selectedCategory,
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
      <h2 className="text-lg font-semibold mb-4 text-gray-800">{t('step2')}</h2>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isLoading &&
          (isCategoryBased ? t('loadingAvailableStylists') : t('loadingStylistsForServices'))}
        {!isLoading && stylists.length > 0 && `${stylists.length} ${t('stylistsAvailable')}`}
        {!isLoading && stylists.length === 0 && t('noStylistsAvailable')}
      </div>

      {showLoader ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <LoadingSpinner size="sm" />
            <p className="text-sm text-gray-600">
              {isCategoryBased
                ? `${t('findingStylistsFor')} ${selectedCategory?.title}...`
                : `${t('findingStylistsWhoCan')} ${selectedServices.map(s => s.name).join(', ')}...`}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StylistCardSkeleton count={3} />
          </div>
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {stylists.map(stylist => {
              const isSelected = selectedStylist?.id === stylist.id;
              return (
                <Card
                  key={stylist.id}
                  onClick={() => onStylistSelect(stylist)}
                  className={`cursor-pointer min-h-[44px] transition-all hover:border-primary ${
                    isSelected ? 'border-primary bg-primary/10' : 'hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      {stylist.avatar ? (
                        <Image
                          src={stylist.avatar}
                          alt={stylist.name}
                          width={52}
                          height={52}
                          className="w-13 h-13 rounded-full mr-4 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4 shrink-0"></div>
                      )}
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold text-foreground">
                            {stylist.name}
                          </h3>
                          {isSelected && (
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white shrink-0 ml-2">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {stylist.bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {stylist.bio}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

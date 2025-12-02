'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { User, Zap } from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';
import { LoadingSpinner } from '../feedback/loaders/LoadingSpinner';
import { StylistCardSkeleton } from '../feedback/loaders/StylistCardSkeleton';
import { ErrorState } from '../feedback/ErrorState';
import { EmptyState } from '../feedback/EmptyState';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import type { Service, Stylist } from '@/types';

interface StylistSelectorProps {
  selectedServices: Service[];
  selectedStylist: Stylist | null;
  onStylistSelect: (stylist: Stylist | null) => void;
  onSkip?: () => void;
}

export const StylistSelector: React.FC<StylistSelectorProps> = ({
  selectedServices,
  selectedStylist,
  onStylistSelect,
  onSkip,
}) => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delayed loading to prevent flash on fast connections
  const showLoader = useDelayedLoading(loading, { delay: 150, minDuration: 300 });

  // Extract fetch function so it can be reused for retry
  const fetchStylists = useCallback(async () => {
    if (selectedServices.length === 0) {
      setStylists([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const serviceIds = selectedServices.map(s => s.id);
      const response = await fetch(`/api/stylists?services=${serviceIds.join(',')}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch stylists: ${response.status}`);
      }

      const availableStylists = await response.json();

      // Validate response is an array
      if (!Array.isArray(availableStylists)) {
        console.error('Invalid response format:', availableStylists);
        throw new Error('Invalid response format from server');
      }

      setStylists(availableStylists);

      // Auto-select if only one stylist is available
      if (availableStylists.length === 1) {
        const singleStylist = availableStylists[0];
        // Only auto-select if not already selected (to avoid loops or overwriting user choice if they navigated back)
        if (selectedStylist?.id !== singleStylist.id) {
          onStylistSelect(singleStylist);
          toast.info(`Auto-selected ${singleStylist.name} as the only available stylist.`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stylists:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unable to load stylists';
      setError(errorMsg);
      toast.error(errorMsg);
      setStylists([]);
    } finally {
      setLoading(false);
    }
  }, [selectedServices, selectedStylist, onStylistSelect]);

  useEffect(() => {
    fetchStylists();
  }, [fetchStylists]);

  if (selectedServices.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 scroll-mt-24" id="stylist-selector" tabIndex={-1}>
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        2. Choose Your Stylist
      </h2>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {loading && 'Loading stylists for your selected services'}
        {!loading && stylists.length > 0 && `${stylists.length} stylists available`}
        {!loading && stylists.length === 0 && 'No stylists available'}
      </div>

      {showLoader ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <LoadingSpinner size="sm" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Finding stylists who can perform {selectedServices.map(s => s.name).join(', ')}...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StylistCardSkeleton count={3} />
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to Load Stylists"
          message={error}
          onRetry={fetchStylists}
          retryText="Try Again"
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
          title="No Stylists Available"
          description="No stylists can perform the selected services. Try selecting different services or contact us for assistance."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {stylists.map(stylist => {
              const isSelected = selectedStylist?.id === stylist.id;
              return (
                <Card
                  key={stylist.id}
                  variant="interactive"
                  selected={isSelected}
                  showCheckmark
                  onClick={() => onStylistSelect(stylist)}
                  className="cursor-pointer min-h-[44px]"
                >
                  <CardContent>
                    <div className="flex items-center mb-4">
                      {stylist.avatar ? (
                        <Image
                          src={stylist.avatar}
                          alt={stylist.name}
                          width={52}
                          height={52}
                          className="w-13 h-13 rounded-full mr-4 object-cover"
                        />
                      ) : (
                        <div className="w-13 h-13 bg-[var(--gray-3)] rounded-full flex items-center justify-center mr-4 shrink-0">
                          <User className="h-6 w-6 text-[var(--gray-9)]" aria-hidden="true" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <h3 className="text-[length:var(--font-size-4)] font-bold text-[var(--gray-12)]">
                          {stylist.name}
                        </h3>
                        <p className="text-[length:var(--font-size-2)] text-[var(--gray-11)] line-clamp-1 text-ellipsis">
                          {stylist.email}
                        </p>
                      </div>
                    </div>
                    {stylist.bio && (
                      <p className="text-[length:var(--font-size-2)] text-[var(--gray-11)] mb-3 line-clamp-2">
                        {stylist.bio}
                      </p>
                    )}
                    {/* <div className="flex flex-wrap gap-2">
                      {stylist.specialties.slice(0, 3).map(service => (
                        <span
                          key={service.id}
                          className={`text-[length:var(--font-size-1)] px-2.5 py-1 rounded-full ${
                            isSelected
                              ? 'bg-[var(--accent-9)] text-white'
                              : 'bg-[var(--gray-3)] text-[var(--gray-11)]'
                          }`}
                        >
                          {service.name}
                        </span>
                      ))}
                      {stylist.specialties.length > 3 && (
                        <span
                          className={`text-[length:var(--font-size-1)] px-2.5 py-1 rounded-full ${
                            isSelected
                              ? 'bg-[var(--accent-9)] text-white'
                              : 'bg-[var(--gray-3)] text-[var(--gray-11)]'
                          }`}
                        >
                          +{stylist.specialties.length - 3}
                        </span>
                      )}
                    </div> */}
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

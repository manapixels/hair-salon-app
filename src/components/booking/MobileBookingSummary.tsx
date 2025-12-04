'use client';

import React, { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/timeUtils';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from 'next-intl';

interface MobileBookingSummaryProps {
  totalPrice: number;
  totalDuration: number;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  nextLabel: string;
  isSubmitting?: boolean;
}

export const MobileBookingSummary = memo<MobileBookingSummaryProps>(
  ({
    totalPrice,
    totalDuration,
    currentStep,
    totalSteps,
    onNext,
    nextLabel,
    isSubmitting = false,
  }) => {
    const t = useTranslations('BookingForm');
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [isCompact, setIsCompact] = useState(false);

    // Keyboard detection using VisualViewport API
    useEffect(() => {
      if (!window.visualViewport) return;

      const handleResize = () => {
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;

        // Keyboard is considered visible if it takes up more than 150px
        setIsKeyboardVisible(keyboardHeight > 150);
      };

      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);

      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
        window.visualViewport?.removeEventListener('scroll', handleResize);
      };
    }, []);

    // Scroll detection for compact mode
    useEffect(() => {
      const handleScroll = () => {
        const scrollPosition = window.scrollY;
        // Switch to compact mode after scrolling down a bit (e.g., 100px)
        setIsCompact(scrollPosition > 100);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Don't render if keyboard is visible to avoid covering inputs
    if (isKeyboardVisible) return null;

    // Don't render if no duration (nothing selected yet)
    // Changed from totalPrice check since category-based booking doesn't have upfront price
    if (totalDuration === 0) return null;

    // Hide at step 4 (confirmation) - form has its own submit button
    if (currentStep === 4) return null;

    return (
      <div
        className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white
        border-t border-gray-200
        shadow-lg transition-all duration-300 ease-in-out
        pb-safe-bottom
        ${isCompact ? 'py-2' : 'py-4'}
        lg:hidden
      `}
      >
        {/* Screen reader announcement for updates */}
        <div className="sr-only" aria-live="polite" role="status">
          {t('stepOf', { current: currentStep, total: totalSteps })}. {t('est')} {t('duration')}{' '}
          {formatDuration(totalDuration)}
        </div>

        <div className="px-4 max-w-md mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {!isCompact && (
                <p className="text-xs font-medium text-gray-500 mb-0.5">
                  {t('stepOf', { current: currentStep, total: totalSteps })}
                </p>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-base font-semibold text-gray-900">
                  {t('categorySelected')}
                </span>
                {!isCompact && (
                  <span className="text-sm text-gray-500">
                     {formatDuration(totalDuration)} {t('est')}
                  </span>
                )}
              </div>
            </div>

            <Button
              onClick={onNext}
              variant="default"
              size="lg"
              disabled={isSubmitting}
              className="shadow-md"
            >
              {isSubmitting && <Spinner className="mr-2" />}
              {nextLabel}
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

MobileBookingSummary.displayName = 'MobileBookingSummary';

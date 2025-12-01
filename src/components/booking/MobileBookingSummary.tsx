'use client';

import React, { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui';
import { formatDuration } from '@/lib/timeUtils';

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

    // Don't render if no price (nothing selected yet)
    if (totalPrice === 0) return null;

    return (
      <div
        className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white dark:bg-gray-900
        border-t border-gray-200 dark:border-gray-800
        shadow-lg transition-all duration-300 ease-in-out
        pb-safe-bottom
        ${isCompact ? 'py-2' : 'py-4'}
        lg:hidden
      `}
      >
        {/* Screen reader announcement for price updates */}
        <div className="sr-only" aria-live="polite" role="status">
          Step {currentStep} of {totalSteps}. Total: ${totalPrice} for{' '}
          {formatDuration(totalDuration)}
        </div>

        <div className="px-4 max-w-md mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {!isCompact && (
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                  Step {currentStep} of {totalSteps}
                </p>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ${totalPrice}
                </span>
                {!isCompact && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    • {formatDuration(totalDuration)}
                  </span>
                )}
              </div>
            </div>

            <Button
              onClick={onNext}
              variant="solid"
              size={isCompact ? 'sm' : 'md'}
              loading={isSubmitting}
              disabled={isSubmitting}
              className="min-w-[120px] min-h-[44px] shadow-md"
            >
              {nextLabel}
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

MobileBookingSummary.displayName = 'MobileBookingSummary';

'use client';

import React, { useState, useEffect, memo } from 'react';
import { useTranslations } from 'next-intl';

interface BookingSummaryProps {
  totalDuration: number;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
}

export const BookingSummary = memo<BookingSummaryProps>(
  ({ totalDuration, currentStep, totalSteps, onNext }) => {
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
        sticky bottom-0 left-0 right-0 z-50
        bg-white
        border-t border-gray-200
        shadow-lg transition-all duration-300 ease-in-out
        pb-safe-bottom
      `}
      >
        {/* Screen reader announcement for updates */}
        <div className="sr-only" aria-live="polite" role="status">
          {t('stepOf', { current: currentStep, total: totalSteps })}
        </div>

        <div className={`px-4 md:px-6 mx-auto ${isCompact ? 'py-2' : 'py-4'}`}>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

BookingSummary.displayName = 'BookingSummary';

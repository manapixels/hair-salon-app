'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface PreSelectionBannerProps {
  categoryName: string;
  isVisible: boolean;
  onDismiss?: () => void;
  autoDismissMs?: number;
}

/**
 * A transient banner that informs users a category was pre-selected for them.
 * Auto-dismisses after a delay and respects reduced motion preferences.
 */
export const PreSelectionBanner: React.FC<PreSelectionBannerProps> = ({
  categoryName,
  isVisible,
  onDismiss,
  autoDismissMs = 4000,
}) => {
  const [show, setShow] = useState(false);
  const t = useTranslations('BookingForm');

  // Handle visibility with animation timing
  useEffect(() => {
    if (isVisible) {
      // Small delay to allow mount animation
      const showTimer = setTimeout(() => setShow(true), 50);
      return () => clearTimeout(showTimer);
    } else {
      setShow(false);
    }
  }, [isVisible]);

  // Auto-dismiss timer
  useEffect(() => {
    if (show && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss?.();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [show, autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setShow(false);
    onDismiss?.();
  };

  if (!isVisible && !show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'relative overflow-hidden rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 mb-4',
        'transition-all duration-300 ease-out',
        'motion-reduce:transition-none',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" aria-hidden="true" />
        </div>
        <p className="text-sm text-foreground flex-1">{t('preSelectedBanner', { categoryName })}</p>
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            'flex-shrink-0 rounded-full p-1',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-primary/10 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
          aria-label={t('dismissBanner')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      {autoDismissMs > 0 && show && (
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-primary/40 motion-reduce:hidden"
          style={{
            animation: `shrink-width ${autoDismissMs}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';

interface UseDelayedLoadingOptions {
  delay?: number;
  minDuration?: number;
}

/**
 * Hook to prevent flashing loading states
 *
 * @param isLoading - The actual loading state
 * @param options - Configuration object
 * @param options.delay - Delay before showing loader (default: 150ms)
 * @param options.minDuration - Minimum time to show loader (default: 300ms)
 * @returns Boolean indicating whether to show the loader
 *
 * @example
 * const [loading, setLoading] = useState(false);
 * const showLoader = useDelayedLoading(loading, { delay: 150, minDuration: 300 });
 *
 * return showLoader ? <Spinner /> : <Content />;
 */
export const useDelayedLoading = (
  isLoading: boolean,
  options: UseDelayedLoadingOptions = {},
): boolean => {
  const { delay = 150, minDuration = 300 } = options;
  const [showLoader, setShowLoader] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  useEffect(() => {
    let delayTimer: NodeJS.Timeout | undefined;
    let minDurationTimer: NodeJS.Timeout | undefined;

    if (isLoading) {
      // Delay showing the loader
      delayTimer = setTimeout(() => {
        setShowLoader(true);
        setLoadingStartTime(Date.now());
      }, delay);
    } else {
      // If loader is showing, ensure it shows for minimum duration
      if (showLoader && loadingStartTime) {
        const elapsedTime = Date.now() - loadingStartTime;
        const remainingTime = Math.max(0, minDuration - elapsedTime);

        minDurationTimer = setTimeout(() => {
          setShowLoader(false);
          setLoadingStartTime(null);
        }, remainingTime);
      } else {
        setShowLoader(false);
        setLoadingStartTime(null);
      }
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (minDurationTimer) clearTimeout(minDurationTimer);
    };
  }, [isLoading, delay, minDuration, showLoader, loadingStartTime]);

  return showLoader;
};

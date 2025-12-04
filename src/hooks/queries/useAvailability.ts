import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/hooks/queryKeys';
import { CACHE_CONFIG } from '@/lib/queryClient';
import { format } from 'date-fns';

interface UseAvailabilityOptions {
  date: Date;
  stylistId?: string;
  duration?: number;
  enabled?: boolean; // Control when query runs
}

/**
 * Query hook for fetching availability slots
 * Uses DYNAMIC cache config with 1-minute stale time (no persistence)
 * Critical: Short cache prevents stale booking slots
 */
export function useAvailability({
  date,
  stylistId,
  duration,
  enabled = true,
}: UseAvailabilityOptions) {
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: queryKeys.availability({
      date: dateStr,
      stylistId,
      duration,
    }),
    queryFn: async (): Promise<string[]> => {
      const params = new URLSearchParams({ date: dateStr });
      if (stylistId) params.append('stylistId', stylistId);
      if (duration) params.append('duration', String(duration));

      return apiClient.get(`/api/availability?${params}`);
    },
    ...CACHE_CONFIG.DYNAMIC,
    enabled, // Only run when needed
    staleTime: 1000 * 60, // 1 minute (availability can change quickly)
  });
}

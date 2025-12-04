import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/hooks/queryKeys';
import { CACHE_CONFIG } from '@/lib/queryClient';
import type { Stylist } from '@/types';

interface UseStylitsOptions {
  serviceIds?: string[]; // Filter by service IDs
  enabled?: boolean; // Control when query runs
}

/**
 * Query hook for fetching stylists
 * - Without serviceIds: Uses STATIC cache (infinite stale time, persisted to IDB)
 * - With serviceIds: Uses shorter cache (5min, not persisted)
 */
export function useStylists(options: UseStylitsOptions = {}) {
  const { serviceIds, enabled = true } = options;

  return useQuery({
    queryKey: serviceIds?.length ? queryKeys.stylists.filtered(serviceIds) : queryKeys.stylists.all,
    queryFn: async (): Promise<Stylist[]> => {
      const query = serviceIds?.length ? `?services=${serviceIds.join(',')}` : '';
      return apiClient.get(`/api/stylists${query}`);
    },
    ...CACHE_CONFIG.STATIC,
    // Override: don't persist filtered queries (too many permutations)
    ...(serviceIds?.length && {
      staleTime: 1000 * 60 * 5, // 5 min for filtered
    }),
    enabled,
  });
}

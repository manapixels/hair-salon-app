import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/hooks/queryKeys';
import { CACHE_CONFIG } from '@/lib/queryClient';
import type { Stylist } from '@/types';

interface UseStylitsOptions {
  categoryId?: string; // Filter by category specialty
  enabled?: boolean; // Control when query runs
}

/**
 * Query hook for fetching stylists
 * - Without categoryId: Uses STATIC cache (infinite stale time, persisted to IDB)
 * - With categoryId: Uses shorter cache (5min, not persisted)
 */
export function useStylists(options: UseStylitsOptions = {}) {
  const { categoryId, enabled = true } = options;

  return useQuery({
    queryKey: categoryId ? queryKeys.stylists.filtered([categoryId]) : queryKeys.stylists.all,
    queryFn: async (): Promise<Stylist[]> => {
      const query = categoryId ? `?category=${categoryId}` : '';
      return apiClient.get(`/api/stylists${query}`);
    },
    ...CACHE_CONFIG.STATIC,
    // Override: don't persist filtered queries (too many permutations)
    ...(categoryId && {
      staleTime: 1000 * 60 * 5, // 5 min for filtered
    }),
    enabled,
  });
}

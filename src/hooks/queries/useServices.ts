import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/hooks/queryKeys';
import { CACHE_CONFIG } from '@/lib/queryClient';
import type { Service } from '@/types';

/**
 * Query hook for fetching all services
 * Uses STATIC cache config with infinite stale time and IndexedDB persistence
 */
export function useServices() {
  return useQuery({
    queryKey: queryKeys.services.all,
    queryFn: async (): Promise<Service[]> => {
      return apiClient.get('/api/services');
    },
    ...CACHE_CONFIG.STATIC, // Infinite stale time, persist to IDB
  });
}

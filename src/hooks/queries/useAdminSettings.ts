import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/hooks/queryKeys';
import { CACHE_CONFIG } from '@/lib/queryClient';
import type { AdminSettings } from '@/types';

/**
 * Query hook for fetching admin settings
 * - Uses USER cache config with 5-minute stale time
 * - Does not refetch on window focus (admin settings don't change often)
 * - Invalidated explicitly when admin updates settings
 */
export function useAdminSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings,
    queryFn: async (): Promise<AdminSettings> => {
      return apiClient.get('/api/admin/settings');
    },
    ...CACHE_CONFIG.USER,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false, // Admin settings don't change often
  });
}

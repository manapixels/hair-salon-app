import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/hooks/queryKeys';
import { CACHE_CONFIG } from '@/lib/queryClient';
import type { User } from '@/types';
import { useEffect } from 'react';

/**
 * Query hook for authentication session
 * - Fetches current user session
 * - Auto-refreshes every 30 minutes
 * - Listens for auth-refresh events
 * - Does NOT persist to IndexedDB (security)
 */
export function useAuth() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: async (): Promise<User | null> => {
      try {
        return await apiClient.get('/api/auth/session');
      } catch (error) {
        // Not logged in
        return null;
      }
    },
    ...CACHE_CONFIG.USER,
    staleTime: 1000 * 60 * 30, // 30 minutes (matches auto-refresh)
    retry: false, // Don't retry auth failures
  });

  // Auto-refresh every 30 minutes (matches existing behavior)
  useEffect(() => {
    if (!query.data) return;

    const interval = setInterval(
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      },
      30 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [query.data, queryClient]);

  // Listen for auth-refresh events (from OAuth)
  useEffect(() => {
    const handleAuthRefresh = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    };

    window.addEventListener('auth-refresh', handleAuthRefresh);
    return () => window.removeEventListener('auth-refresh', handleAuthRefresh);
  }, [queryClient]);

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

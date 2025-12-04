import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/hooks/queryKeys';
import { CACHE_CONFIG } from '@/lib/queryClient';
import { useAuth } from './useAuth';

interface UserPattern {
  favoriteService?: string;
  favoriteStylistId?: string;
  typicalTime?: string;
}

/**
 * Query hook for fetching user booking pattern
 * - Only runs when user is logged in
 * - Uses USER cache config (2-minute stale time)
 */
export function useUserPattern() {
  const { user } = useAuth();

  return useQuery({
    queryKey: user ? queryKeys.user.pattern(user.id) : ['user-pattern-guest'],
    queryFn: async (): Promise<UserPattern | null> => {
      try {
        return await apiClient.get('/api/user/pattern');
      } catch (error) {
        return null;
      }
    },
    ...CACHE_CONFIG.USER,
    enabled: !!user, // Only run if logged in
  });
}

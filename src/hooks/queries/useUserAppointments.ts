import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/hooks/queryKeys';
import { CACHE_CONFIG } from '@/lib/queryClient';
import { useAuth } from './useAuth';
import type { Appointment } from '@/types';

/**
 * Query hook for fetching user's appointments
 * - Only runs when user is logged in
 * - Uses USER cache config (2-minute stale time)
 * - Refetches on window focus to keep data fresh
 */
export function useUserAppointments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: user ? queryKeys.user.appointments(user.id) : ['user-appointments-guest'],
    queryFn: async (): Promise<Appointment[]> => {
      return apiClient.get('/api/appointments/user');
    },
    ...CACHE_CONFIG.USER,
    enabled: !!user, // Only run if logged in
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

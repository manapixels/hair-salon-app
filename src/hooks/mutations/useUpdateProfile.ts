import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/hooks/queryKeys';
import { toast } from 'sonner';
import type { User } from '@/types';

interface UpdateProfileInput {
  name: string;
}

/**
 * Mutation hook for updating user profile
 *
 * Invalidation strategy:
 * - Optimistic update: Update name immediately in UI
 * - Rollback if fails
 * - Invalidates session to refetch latest data
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileInput): Promise<User> => {
      return apiClient.patch('/api/user/profile', data);
    },
    onMutate: async newData => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.session });

      const previousUser = queryClient.getQueryData<User>(queryKeys.auth.session);

      if (previousUser) {
        queryClient.setQueryData<User>(queryKeys.auth.session, {
          ...previousUser,
          name: newData.name,
        });
      }

      return { previousUser };
    },
    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.auth.session, context.previousUser);
      }
      toast.error('Failed to update profile');
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      toast.success('Display name updated successfully!');
    },
  });
}

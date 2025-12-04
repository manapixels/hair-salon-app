import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/hooks/queryKeys';
import { toast } from 'sonner';
import type { Appointment } from '@/types';

interface CancelAppointmentInput {
  appointmentId: string;
}

/**
 * Mutation hook for canceling appointments
 *
 * Invalidation strategy:
 * - Optimistic update: Remove immediately from UI
 * - Rollback if API fails
 * - Invalidates user appointments + admin appointments
 * - Invalidates all availability (slot becomes available)
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appointmentId }: CancelAppointmentInput): Promise<void> => {
      return apiClient.delete('/api/appointments/user-cancel', { appointmentId });
    },
    onMutate: async ({ appointmentId }) => {
      // Optimistic update: remove from UI immediately
      const userId = queryClient.getQueryData<any>(queryKeys.auth.session)?.id;

      if (userId) {
        const queryKey = queryKeys.user.appointments(userId);

        // Cancel ongoing refetches
        await queryClient.cancelQueries({ queryKey });

        // Snapshot previous value
        const previousAppointments = queryClient.getQueryData<Appointment[]>(queryKey);

        // Optimistically update
        queryClient.setQueryData<Appointment[]>(
          queryKey,
          old => old?.filter(apt => apt.id !== appointmentId) ?? [],
        );

        return { previousAppointments, userId };
      }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousAppointments && context?.userId) {
        queryClient.setQueryData(
          queryKeys.user.appointments(context.userId),
          context.previousAppointments,
        );
      }
      toast.error('Failed to cancel appointment');
    },
    onSuccess: (data, variables, context) => {
      toast.success('Appointment cancelled successfully');

      // Still invalidate to ensure consistency
      if (context?.userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.user.appointments(context.userId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.appointments,
      });

      // Invalidate all availability (slot becomes available)
      queryClient.invalidateQueries({
        queryKey: ['availability'],
      });
    },
  });
}

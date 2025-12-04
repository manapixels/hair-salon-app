import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/hooks/queryKeys';
import { toast } from 'sonner';
import type { Appointment } from '@/types';

interface RescheduleInput {
  appointmentId: string;
  newDate: Date;
  newTime: string;
}

/**
 * Mutation hook for rescheduling appointments
 *
 * Invalidation strategy:
 * - Invalidates user appointments
 * - Invalidates ALL availability (old + new date affected)
 * - Invalidates admin appointments
 *
 * No optimistic update (complex state change)
 */
export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RescheduleInput): Promise<Appointment> => {
      return apiClient.post('/api/appointments/user-reschedule', data);
    },
    onSuccess: updatedAppointment => {
      const userId = updatedAppointment.userId;

      // Invalidate user appointments
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.user.appointments(userId),
        });
      }

      // Invalidate availability for both old and new dates
      queryClient.invalidateQueries({
        queryKey: ['availability'], // Wildcard: invalidate all availability
      });

      // Invalidate admin appointments
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.appointments,
      });

      toast.success('Appointment rescheduled successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reschedule appointment');
    },
  });
}

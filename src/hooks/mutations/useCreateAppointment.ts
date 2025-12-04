import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/hooks/queryKeys';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { CreateAppointmentInput, Appointment } from '@/types';

/**
 * Mutation hook for creating appointments
 *
 * Invalidation strategy:
 * - Invalidates availability for that date/stylist (slot is now booked)
 * - Invalidates user's appointment list (new appointment added)
 * - Invalidates admin appointments (for dashboard)
 *
 * No optimistic update (critical operation, wait for confirmation)
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAppointmentInput): Promise<Appointment> => {
      return apiClient.post('/api/appointments', data);
    },
    onSuccess: newAppointment => {
      // Invalidate availability for that date/stylist
      const stylistId = newAppointment.stylistId ?? undefined;
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability({
          date: format(newAppointment.date, 'yyyy-MM-dd'),
          stylistId,
        }),
      });

      // Invalidate user's appointments if logged in
      if (newAppointment.userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.user.appointments(newAppointment.userId),
        });
      }

      // Invalidate admin appointments
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.appointments,
      });

      toast.success('Appointment booked successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to book appointment');
    },
  });
}

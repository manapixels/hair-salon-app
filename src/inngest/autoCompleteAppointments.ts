import { inngest } from '@/lib/inngest';
import { prisma } from '@/lib/prisma';
import { markAppointmentCompleted } from '@/lib/database';

export const autoCompleteAppointments = inngest.createFunction(
  { id: 'auto-complete-appointments', name: 'Auto-Complete Past Appointments' },
  { cron: '0 1 * * *' }, // Daily at 1 AM
  async ({ step }) => {
    const pastAppointments = await step.run('fetch-past-appointments', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Find scheduled appointments where date + time is more than 1 hour ago
      const appointments = await prisma.appointment.findMany({
        where: {
          status: 'SCHEDULED',
          date: {
            lt: now, // Date is in the past
          },
        },
        select: {
          id: true,
          date: true,
          time: true,
          userId: true,
        },
      });

      // Filter to only include appointments where date+time < now - 1 hour
      return appointments.filter(apt => {
        const [hours, minutes] = apt.time.split(':').map(Number);
        const appointmentDateTime = new Date(apt.date);
        appointmentDateTime.setHours(hours, minutes, 0, 0);

        return appointmentDateTime < oneHourAgo;
      });
    });

    if (pastAppointments.length === 0) {
      return { message: 'No past appointments to complete', count: 0 };
    }

    const results = await step.run('mark-appointments-completed', async () => {
      const completionResults = await Promise.allSettled(
        pastAppointments.map(async appointment => {
          if (!appointment.userId) {
            // Skip guest bookings without userId
            return { success: false, reason: 'No userId' };
          }

          try {
            await markAppointmentCompleted(appointment.id);
            return { success: true, id: appointment.id };
          } catch (error) {
            return {
              success: false,
              id: appointment.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        }),
      );

      return {
        total: pastAppointments.length,
        successful: completionResults.filter(r => r.status === 'fulfilled' && r.value.success)
          .length,
        failed: completionResults.filter(
          r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success),
        ).length,
      };
    });

    return {
      message: 'Past appointments auto-completed',
      ...results,
    };
  },
);

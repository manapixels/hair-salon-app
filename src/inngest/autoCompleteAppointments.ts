import { inngest } from '@/lib/inngest';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, lt } from 'drizzle-orm';
import { markAppointmentCompleted } from '@/lib/database';

export const autoCompleteAppointments = inngest.createFunction(
  { id: 'auto-complete-appointments', name: 'Auto-Complete Past Appointments' },
  { cron: '0 1 * * *' }, // Daily at 1 AM
  async ({ step }) => {
    const pastAppointments = await step.run('fetch-past-appointments', async () => {
      const db = await getDb();
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Find scheduled appointments where date is in the past
      const appointments = await db
        .select({
          id: schema.appointments.id,
          date: schema.appointments.date,
          time: schema.appointments.time,
          userId: schema.appointments.userId,
        })
        .from(schema.appointments)
        .where(eq(schema.appointments.status, 'SCHEDULED'));

      // Filter to only include appointments where date+time < now - 1 hour
      return appointments.filter(apt => {
        if (apt.date >= now) return false;
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

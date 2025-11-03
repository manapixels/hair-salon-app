import { inngest } from '@/lib/inngest';
import { createCalendarEvent } from '@/lib/google';
import { updateAppointmentCalendarId, getUnsyncedAppointments } from '@/lib/database';
import type { Appointment } from '@/types';

export const syncAppointmentsToCalendar = inngest.createFunction(
  { id: 'sync-appointments-to-calendar' },
  { cron: '0 * * * *' }, // Run every hour
  async ({ step }) => {
    const unsyncedAppointments = await step.run('find-unsynced-appointments', async () => {
      return await getUnsyncedAppointments();
    });

    if (unsyncedAppointments.length === 0) {
      return { message: 'No unsynced appointments found.' };
    }

    let successCount = 0;
    let errorCount = 0;

    for (const appt of unsyncedAppointments) {
      await step.run(`sync-appointment-${appt.id}`, async () => {
        try {
          // Convert date strings back to Date objects
          const appointmentWithDates = {
            ...appt,
            date: new Date(appt.date),
            createdAt: new Date(appt.createdAt),
            updatedAt: new Date(appt.updatedAt),
          } as Appointment;
          const calendarEventId = await createCalendarEvent(appointmentWithDates);
          if (calendarEventId) {
            await updateAppointmentCalendarId(appt.id, calendarEventId);
            console.log(`Successfully synced appointment ${appt.id} to calendar.`);
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to sync appointment ${appt.id}:`, error);
          errorCount++;
        }
      });
    }

    return {
      message: `Sync complete. Synced: ${successCount}, Failed: ${errorCount}.`,
      syncedCount: successCount,
      failedCount: errorCount,
    };
  },
);

import { inngest } from '@/lib/inngest';
import { getUpcomingAppointmentsForReminders, markReminderSent } from '@/lib/database';
import { sendBulkReminders } from '@/services/reminderService';

// 3 days = 72 hours
const REMINDER_HOURS_AHEAD = 72;

export const sendAppointmentReminders = inngest.createFunction(
  { id: 'send-appointment-reminders', name: 'Send 3-Day Appointment Reminders' },
  { cron: '0 9 * * *' }, // Daily at 9 AM UTC
  async ({ step }) => {
    const appointments = await step.run('fetch-upcoming-appointments', async () => {
      return await getUpcomingAppointmentsForReminders(REMINDER_HOURS_AHEAD);
    });

    if (appointments.length === 0) {
      return { message: 'No appointments need reminders', count: 0 };
    }

    const results = await step.run('send-reminder-messages', async () => {
      // Re-fetch appointments within step to avoid serialization issues
      const appointmentsToProcess = await getUpcomingAppointmentsForReminders(REMINDER_HOURS_AHEAD);
      const reminderResults = await sendBulkReminders(appointmentsToProcess);

      // Mark successful reminders as sent
      const successfulReminders = reminderResults.filter(r => r.success);
      await Promise.allSettled(
        successfulReminders.map(async result => {
          try {
            await markReminderSent(result.appointmentId);
          } catch (error) {
            console.error(
              `Failed to mark reminder as sent for appointment ${result.appointmentId}:`,
              error,
            );
          }
        }),
      );

      return {
        total: appointments.length,
        successful: reminderResults.filter(r => r.success).length,
        failed: reminderResults.filter(r => !r.success).length,
      };
    });

    return {
      message: 'Appointment reminders processed',
      ...results,
    };
  },
);

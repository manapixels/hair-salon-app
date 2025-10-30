import { inngest } from '@/lib/inngest';
import { RETENTION_CONFIG } from '@/config/retention';
import { getUsersNeedingRebooking } from '@/services/retentionService';
import { generateRebookingNudgeMessage } from '@/services/messageTemplates';
import { sendRetentionMessage } from '@/services/retentionMessageService';

export const sendRebookingReminders = inngest.createFunction(
  { id: 'send-rebooking-reminders', name: 'Send Rebooking Reminders' },
  { cron: '0 10 * * 1' }, // Weekly on Monday at 10 AM
  async ({ step }) => {
    const users = await step.run('fetch-users-needing-rebooking', async () => {
      return await getUsersNeedingRebooking();
    });

    if (users.length === 0) {
      return { message: 'No users need rebooking reminders', count: 0 };
    }

    const results = await step.run('send-rebooking-messages', async () => {
      const sendResults = await Promise.allSettled(
        users.map(async user => {
          const lastAppointment = user.appointments[0];
          if (!lastAppointment) {
            return { success: false, error: 'No appointment history' };
          }

          const message = generateRebookingNudgeMessage(user, lastAppointment);

          const daysSinceVisit = user.lastVisitDate
            ? Math.floor(
                (Date.now() - new Date(user.lastVisitDate).getTime()) / (24 * 60 * 60 * 1000),
              )
            : 0;

          return await sendRetentionMessage(user.id, message, 'REBOOKING_NUDGE', daysSinceVisit);
        }),
      );

      return {
        total: users.length,
        successful: sendResults.filter(r => r.status === 'fulfilled' && r.value.success).length,
        failed: sendResults.filter(r => r.status === 'rejected' || !r.value.success).length,
      };
    });

    return {
      message: 'Rebooking reminders processed',
      ...results,
    };
  },
);

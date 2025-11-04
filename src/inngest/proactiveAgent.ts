import { inngest } from '@/lib/inngest';
import { getUsersForRebookingReminders } from '@/lib/database';
import { GetStepTools } from 'inngest';

export const proactiveAgent = inngest.createFunction(
  { id: 'proactive-agent' },
  { cron: '*/5 * * * *' },
  async ({ step }: { step: GetStepTools<typeof inngest> }) => {
    const usersToRemind = await step.run('find-users-for-rebooking', async () => {
      console.log('Proactive agent is scanning for users to remind...');
      const users = await getUsersForRebookingReminders(28);
      return users;
    });

    if (usersToRemind && usersToRemind.length > 0) {
      for (const user of usersToRemind) {
        await step.sendEvent('send-customer-suggestions', {
          name: 'app/customer.suggestions.needed',
          data: { userId: user.id },
        });
      }
    }
  },
);

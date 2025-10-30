import { inngest } from '@/lib/inngest';
import { RETENTION_CONFIG } from '@/config/retention';
import { getUsersForWinBack } from '@/services/retentionService';
import { generateWinBackMessage } from '@/services/messageTemplates';
import { sendRetentionMessage } from '@/services/retentionMessageService';

export const sendWinBackCampaigns = inngest.createFunction(
  { id: 'send-winback-campaigns', name: 'Send Win-Back Campaigns' },
  { cron: '0 10 1 * *' }, // Monthly on 1st day at 10 AM
  async ({ step }) => {
    const users = await step.run('fetch-users-for-winback', async () => {
      return await getUsersForWinBack();
    });

    if (users.length === 0) {
      return { message: 'No users need win-back campaigns', count: 0 };
    }

    const results = await step.run('send-winback-messages', async () => {
      const sendResults = await Promise.allSettled(
        users.map(async user => {
          const message = generateWinBackMessage(user);

          const daysSinceVisit = user.lastVisitDate
            ? Math.floor(
                (Date.now() - new Date(user.lastVisitDate).getTime()) / (24 * 60 * 60 * 1000),
              )
            : 0;

          return await sendRetentionMessage(user.id, message, 'WIN_BACK', daysSinceVisit);
        }),
      );

      return {
        total: users.length,
        successful: sendResults.filter(r => r.status === 'fulfilled' && r.value.success).length,
        failed: sendResults.filter(r => r.status === 'rejected' || !r.value.success).length,
      };
    });

    return {
      message: 'Win-back campaigns processed',
      ...results,
    };
  },
);

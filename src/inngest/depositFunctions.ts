import { inngest } from '@/lib/inngest';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, lt, gte, sql } from 'drizzle-orm';
import { sendTelegramMessage, sendWhatsAppMessage } from '@/services/messagingService';

// Time constants
const SINGAPORE_TIMEZONE = 'Asia/Singapore';

/**
 * Auto-cancel appointments with unpaid deposits after 15 minutes
 * Runs every 15 minutes
 */
export const autoCancelUnpaidDeposits = inngest.createFunction(
  { id: 'auto-cancel-unpaid-deposits', name: 'Auto-Cancel Unpaid Deposits' },
  { cron: '*/15 * * * *' }, // Every 15 minutes
  async ({ step }) => {
    const { cleanupPendingAppointments } = await import('@/lib/database');

    const count = await step.run('run-cleanup', async () => {
      return await cleanupPendingAppointments();
    });

    return {
      message: `Ran auto-cancellation cleanup.`,
      cancelledCount: count,
    };
  },
);

/**
 * Send daily deposit summary to admins
 * Runs at 8 PM Singapore time (12:00 UTC)
 */
export const sendDailyDepositSummary = inngest.createFunction(
  { id: 'send-daily-deposit-summary', name: 'Daily Deposit Summary for Admins' },
  { cron: '0 12 * * *' }, // 12:00 UTC = 8 PM SGT
  async ({ step }) => {
    const summary = await step.run('generate-daily-summary', async () => {
      const db = await getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's deposit stats
      const deposits = await db
        .select()
        .from(schema.deposits)
        .where(and(gte(schema.deposits.createdAt, today), lt(schema.deposits.createdAt, tomorrow)));

      const paid = deposits.filter(d => d.status === 'PAID');
      const pending = deposits.filter(d => d.status === 'PENDING');
      const forfeited = deposits.filter(d => d.status === 'FORFEITED');

      const totalPaidAmount = paid.reduce((sum, d) => sum + d.amount, 0);

      return {
        total: deposits.length,
        paid: paid.length,
        pending: pending.length,
        forfeited: forfeited.length,
        totalPaidAmount,
      };
    });

    // Only send if there was activity
    if (summary.total === 0) {
      return { message: 'No deposit activity today', sent: false };
    }

    const sent = await step.run('send-admin-notifications', async () => {
      const db = await getDb();

      // Get all admin users
      const admins = await db
        .select()
        .from(schema.users)
        .where(sql`'ADMIN' = ANY(${schema.users.roles})`);

      const dateStr = new Date().toLocaleDateString('en-SG', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        timeZone: SINGAPORE_TIMEZONE,
      });

      const message = `📊 *Daily Deposit Summary*
${dateStr}

💰 Total deposits: ${summary.total}
✅ Paid: ${summary.paid} ($${(summary.totalPaidAmount / 100).toFixed(2)})
⏳ Pending: ${summary.pending}
❌ Forfeited: ${summary.forfeited}`;

      let sentCount = 0;

      for (const admin of admins) {
        try {
          if (admin.telegramId) {
            await sendTelegramMessage(Number(admin.telegramId), message);
            sentCount++;
          } else if (admin.whatsappPhone) {
            await sendWhatsAppMessage(admin.whatsappPhone, message);
            sentCount++;
          }
        } catch (error) {
          console.error(`[DepositSummary] Failed to send to admin ${admin.email}:`, error);
        }
      }

      return { adminsNotified: sentCount };
    });

    return {
      message: 'Daily deposit summary sent',
      ...summary,
      ...sent,
    };
  },
);

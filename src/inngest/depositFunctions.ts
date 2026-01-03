/**
 * Inngest functions for deposit management:
 * 1. Auto-cancel unpaid deposits after 2 hours
 * 2. Daily deposit summary for admins
 */
import { inngest } from '@/lib/inngest';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, lt, gte, sql } from 'drizzle-orm';
import { sendTelegramMessage, sendWhatsAppMessage } from '@/services/messagingService';

// Time constants
const DEPOSIT_EXPIRY_HOURS = 2;
const SINGAPORE_TIMEZONE = 'Asia/Singapore';

/**
 * Auto-cancel appointments with unpaid deposits after 2 hours
 * Runs every 15 minutes
 */
export const autoCancelUnpaidDeposits = inngest.createFunction(
  { id: 'auto-cancel-unpaid-deposits', name: 'Auto-Cancel Unpaid Deposits' },
  { cron: '*/15 * * * *' }, // Every 15 minutes
  async ({ step }) => {
    const cancelled = await step.run('cancel-expired-deposits', async () => {
      const db = await getDb();
      const expiryTime = new Date(Date.now() - DEPOSIT_EXPIRY_HOURS * 60 * 60 * 1000);

      // Find pending deposits that have expired
      const expiredDeposits = await db
        .select({
          depositId: schema.deposits.id,
          appointmentId: schema.deposits.appointmentId,
          customerEmail: schema.deposits.customerEmail,
          userId: schema.deposits.userId,
        })
        .from(schema.deposits)
        .where(
          and(eq(schema.deposits.status, 'PENDING'), lt(schema.deposits.createdAt, expiryTime)),
        );

      if (expiredDeposits.length === 0) {
        return { cancelled: 0, notified: 0 };
      }

      let notifiedCount = 0;
      const recoveryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/booking/status`;

      // Cancel each deposit and notify customer
      for (const deposit of expiredDeposits) {
        // Update deposit status to forfeited
        await db
          .update(schema.deposits)
          .set({ status: 'FORFEITED' })
          .where(eq(schema.deposits.id, deposit.depositId));

        // Cancel the appointment
        await db
          .update(schema.appointments)
          .set({ status: 'CANCELLED', updatedAt: new Date() })
          .where(eq(schema.appointments.id, deposit.appointmentId));

        console.log(
          `[Deposit] Auto-cancelled appointment ${deposit.appointmentId} - deposit unpaid`,
        );

        // Try to notify customer if they have a linked user account
        if (deposit.userId) {
          try {
            const userResult = await db
              .select()
              .from(schema.users)
              .where(eq(schema.users.id, deposit.userId))
              .limit(1);

            const user = userResult[0];
            if (user) {
              const message = `⚠️ Your booking was cancelled because the deposit was not completed within 2 hours.\n\nYou can start a new booking anytime:\n${recoveryUrl}`;

              if (user.telegramId) {
                await sendTelegramMessage(Number(user.telegramId), message);
                notifiedCount++;
              } else if (user.whatsappPhone) {
                await sendWhatsAppMessage(user.whatsappPhone, message);
                notifiedCount++;
              }
            }
          } catch (notifyError) {
            console.error(`[Deposit] Failed to notify customer:`, notifyError);
          }
        }
      }

      return { cancelled: expiredDeposits.length, notified: notifiedCount };
    });

    return {
      message: `Auto-cancelled ${cancelled.cancelled} appointments, notified ${cancelled.notified} customers`,
      ...cancelled,
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

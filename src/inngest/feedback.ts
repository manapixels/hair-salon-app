import { inngest } from '@/lib/inngest';
import { RETENTION_CONFIG } from '@/config/retention';
import { getCompletedAppointmentsNeedingFeedback } from '@/services/retentionService';
import { generateFeedbackRequestMessage } from '@/services/messageTemplates';
import { sendRetentionMessage } from '@/services/retentionMessageService';
import { prisma } from '@/lib/prisma';

export const sendFeedbackRequests = inngest.createFunction(
  { id: 'send-feedback-requests', name: 'Send Feedback Requests' },
  { cron: '0 */4 * * *' }, // Every 4 hours
  async ({ step }) => {
    const appointments = await step.run('fetch-appointments', async () => {
      return await getCompletedAppointmentsNeedingFeedback();
    });

    if (appointments.length === 0) {
      return { message: 'No appointments need feedback', count: 0 };
    }

    const results = await step.run('send-feedback-messages', async () => {
      const sendResults = await Promise.allSettled(
        appointments.map(async appointment => {
          if (!appointment.user || !appointment.userId) {
            return { success: false, error: 'No user found' };
          }

          const message = generateFeedbackRequestMessage(appointment.user, appointment);

          const daysSinceVisit = appointment.completedAt
            ? Math.floor(
                (Date.now() - new Date(appointment.completedAt).getTime()) / (24 * 60 * 60 * 1000),
              )
            : 0;

          const result = await sendRetentionMessage(
            appointment.userId,
            message,
            'FEEDBACK_REQUEST',
            daysSinceVisit,
            appointment.id, // Pass appointmentId for inline keyboard buttons
          );

          // Mark appointment as having feedback request sent
          if (result.success) {
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: { feedbackSent: true },
            });
          }

          return result;
        }),
      );

      return {
        total: appointments.length,
        successful: sendResults.filter(r => r.status === 'fulfilled' && r.value.success).length,
        failed: sendResults.filter(r => r.status === 'rejected' || !r.value.success).length,
      };
    });

    return {
      message: 'Feedback requests processed',
      ...results,
    };
  },
);

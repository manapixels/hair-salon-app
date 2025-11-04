import { inngest } from '@/lib/inngest';
import { findUserById, getLastAppointmentByUserId } from '@/lib/database';
import { handleWhatsAppMessage } from '@/services/geminiService';
import { sendWhatsAppMessage, sendTelegramMessage } from '@/services/messagingService';

export const customerSuggestions = inngest.createFunction(
  { id: 'customer-suggestions' },
  { event: 'app/customer.suggestions.needed' },
  async ({ event, step }) => {
    const { userId } = event.data;

    const user = await step.run('get-user-details', () => findUserById(userId));
    if (!user) return;

    const lastAppointment = await step.run('get-last-appointment', () =>
      getLastAppointmentByUserId(userId),
    );
    if (!lastAppointment) return;

    const suggestion = await step.run('generate-suggestion', async () => {
      const prompt = `The user ${user.name} is due for a new appointment. Their last appointment was on ${lastAppointment.date} for the following services: ${lastAppointment.services.map(s => s.name).join(', ')}. Please generate a friendly and personalized message to encourage them to rebook.`;
      const response = await handleWhatsAppMessage(prompt, []);
      return response.text;
    });

    await step.run('send-suggestion', async () => {
      if (user.authProvider === 'whatsapp' && user.whatsappPhone) {
        await sendWhatsAppMessage(user.whatsappPhone, suggestion);
      } else if (user.authProvider === 'telegram' && user.telegramId) {
        await sendTelegramMessage(user.telegramId, suggestion);
      }
    });
  },
);

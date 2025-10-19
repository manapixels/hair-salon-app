import type { Appointment, User } from '@/types';
import { sendWhatsAppMessage, sendTelegramMessage } from './messagingService';
import { formatLongDate } from '@/lib/timeUtils';
import type { InlineKeyboard } from './botCommandService';

export interface ReminderResult {
  appointmentId: string;
  success: boolean;
  error?: string;
  method?: 'whatsapp' | 'telegram' | 'none';
}

/**
 * Sends an appointment reminder to a user via their preferred method
 */
export const sendAppointmentReminder = async (
  appointment: Appointment,
): Promise<ReminderResult> => {
  if (!appointment.user) {
    return {
      appointmentId: appointment.id,
      success: false,
      error: 'No user data available for reminder',
      method: 'none',
    };
  }

  const user = appointment.user;
  const { message: reminderMessage, keyboard } = formatReminderMessage(appointment);

  // Determine the best method to send reminder based on user's auth provider
  try {
    if (user.authProvider === 'whatsapp' && user.whatsappPhone) {
      const success = await sendWhatsAppMessage(user.whatsappPhone, reminderMessage);
      return {
        appointmentId: appointment.id,
        success,
        method: 'whatsapp',
        error: success ? undefined : 'Failed to send WhatsApp reminder',
      };
    } else if (user.authProvider === 'telegram' && user.telegramId) {
      // Import Telegram send function with keyboard support
      const { sendTelegramMessageWithKeyboard } = await import('./messagingService');
      const success = await sendTelegramMessageWithKeyboard(
        user.telegramId,
        reminderMessage,
        keyboard,
      );
      return {
        appointmentId: appointment.id,
        success,
        method: 'telegram',
        error: success ? undefined : 'Failed to send Telegram reminder',
      };
    } else {
      // Try WhatsApp first, then Telegram as fallback
      if (user.whatsappPhone) {
        const success = await sendWhatsAppMessage(user.whatsappPhone, reminderMessage);
        if (success) {
          return { appointmentId: appointment.id, success: true, method: 'whatsapp' };
        }
      }

      if (user.telegramId) {
        const { sendTelegramMessageWithKeyboard } = await import('./messagingService');
        const success = await sendTelegramMessageWithKeyboard(
          user.telegramId,
          reminderMessage,
          keyboard,
        );
        return {
          appointmentId: appointment.id,
          success,
          method: 'telegram',
          error: success ? undefined : 'Failed to send Telegram reminder',
        };
      }

      return {
        appointmentId: appointment.id,
        success: false,
        error: 'No valid contact method available',
        method: 'none',
      };
    }
  } catch (error) {
    return {
      appointmentId: appointment.id,
      success: false,
      error: `Reminder failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      method: 'none',
    };
  }
};

/**
 * Formats the reminder message for an appointment with interactive buttons
 */
export const formatReminderMessage = (
  appointment: Appointment,
): { message: string; keyboard: InlineKeyboard } => {
  const formattedDate = formatLongDate(appointment.date);

  const serviceNames = appointment.services.map(s => s.name).join(', ');
  const stylistInfo = appointment.stylist ? ` with ${appointment.stylist.name}` : '';

  const message = `🔔 *Appointment Reminder*

Hi ${appointment.user?.name || appointment.customerName}! Your appointment is tomorrow at ${appointment.time} 📅

✂️ *Services:* ${serviceNames}
👩‍💇 *Stylist:* ${appointment.stylist?.name || 'To be assigned'}
💰 *Total:* $${appointment.totalPrice}
⏱️ *Duration:* ${appointment.totalDuration} minutes
📍 *Location:* Luxe Cuts Hair Salon

Looking forward to seeing you! ✨`;

  // Create interactive keyboard with action buttons
  const keyboard: InlineKeyboard = {
    inline_keyboard: [
      [
        { text: "✅ I'll Be There", callback_data: `confirm_reminder_${appointment.id}` },
        { text: '🔄 Reschedule', callback_data: `reschedule_reminder_${appointment.id}` },
      ],
      [{ text: '❌ Cancel Appointment', callback_data: `cancel_reminder_${appointment.id}` }],
    ],
  };

  return { message, keyboard };
};

/**
 * Sends reminders for multiple appointments
 */
export const sendBulkReminders = async (appointments: Appointment[]): Promise<ReminderResult[]> => {
  const results: ReminderResult[] = [];

  for (const appointment of appointments) {
    const result = await sendAppointmentReminder(appointment);
    results.push(result);

    // Add a small delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
};

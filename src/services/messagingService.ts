import type { Appointment, User } from '../types';
import { formatLongDate } from '@/lib/timeUtils';

/**
 * Messaging Service for appointment confirmations
 * Handles WhatsApp and Telegram notifications based on user auth provider
 */

/**
 * Sends a WhatsApp message using Meta Graph API
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn('WhatsApp credentials not configured, simulating message send');
    console.log(`[WhatsApp Simulation] To: ${to}, Message: ${text}`);
    return false;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: {
      preview_url: false,
      body: text,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send WhatsApp message:', JSON.stringify(errorData, null, 2));
      return false;
    }

    console.log(`✅ WhatsApp confirmation sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Exception when sending WhatsApp message:', error);
    return false;
  }
}

/**
 * Sends a Telegram message using Bot API
 */
export async function sendTelegramMessage(chatId: number, text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn('Telegram bot token not configured, simulating message send');
    console.log(`[Telegram Simulation] Chat ID: ${chatId}, Message: ${text}`);
    return false;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send Telegram message:', JSON.stringify(errorData, null, 2));
      return false;
    }

    console.log(`✅ Telegram confirmation sent to chat ${chatId}`);
    return true;
  } catch (error) {
    console.error('Exception when sending Telegram message:', error);
    return false;
  }
}

/**
 * Sends a Telegram message with inline keyboard buttons
 */
export async function sendTelegramMessageWithKeyboard(
  chatId: number,
  text: string,
  keyboard: any, // InlineKeyboard type from botCommandService
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn('Telegram bot token not configured, simulating message send with keyboard');
    console.log(`[Telegram Simulation] Chat ID: ${chatId}, Message: ${text}`);
    return false;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        'Failed to send Telegram message with keyboard:',
        JSON.stringify(errorData, null, 2),
      );
      return false;
    }

    console.log(`✅ Telegram message with keyboard sent to chat ${chatId}`);
    return true;
  } catch (error) {
    console.error('Exception when sending Telegram message with keyboard:', error);
    return false;
  }
}

/**
 * Formats appointment details into a user-friendly message
 */
function formatAppointmentMessage(
  appointment: Appointment,
  messageType: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule',
): string {
  const date = formatLongDate(appointment.date);

  const services = appointment.services.map(s => s.name).join(', ');

  switch (messageType) {
    case 'confirmation':
      return `🎉 *Appointment Confirmed!*

*Luxe Cuts Hair Salon*

📅 *Date:* ${date}
🕐 *Time:* ${appointment.time}
✂️ *Services:* ${services}
💰 *Total:* $${appointment.totalPrice}
⏱️ *Duration:* ${appointment.totalDuration} minutes

Thank you for booking with us! We look forward to seeing you.

💡 *Tip:* Please arrive 5-10 minutes early for your appointment.`;

    case 'reminder':
      return `⏰ *Appointment Reminder*

*Luxe Cuts Hair Salon*

Your appointment is tomorrow:

📅 *Date:* ${date}
🕐 *Time:* ${appointment.time}
✂️ *Services:* ${services}

See you soon! 💇‍♀️`;

    case 'cancellation':
      return `❌ *Appointment Cancelled*

*Luxe Cuts Hair Salon*

Your appointment has been cancelled:

📅 *Date:* ${date}
🕐 *Time:* ${appointment.time}
✂️ *Services:* ${services}

We hope to see you again soon! Book anytime through our website or chat.`;

    case 'reschedule':
      return `🔄 *Appointment Rescheduled!*

*Luxe Cuts Hair Salon*

Your appointment has been successfully rescheduled:

📅 *New Date:* ${date}
🕐 *New Time:* ${appointment.time}
✂️ *Services:* ${services}
💰 *Total:* $${appointment.totalPrice}
⏱️ *Duration:* ${appointment.totalDuration} minutes
${appointment.stylist ? `👤 *Stylist:* ${appointment.stylist.name}` : ''}

Thank you for choosing Luxe Cuts! We look forward to seeing you at your new appointment time.

💡 *Tip:* Please arrive 5-10 minutes early for your appointment.`;

    default:
      return 'Appointment update from Luxe Cuts Hair Salon';
  }
}

/**
 * Sends appointment confirmation based on user's auth provider
 */
export async function sendAppointmentConfirmation(
  user: User | null,
  appointment: Appointment,
  messageType: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule' = 'confirmation',
): Promise<boolean> {
  // If no user or user has no messaging info, skip notification
  if (!user || (!user.whatsappPhone && !user.telegramId)) {
    console.log('No messaging contact info available for user, skipping notification');
    return false;
  }

  const message = formatAppointmentMessage(appointment, messageType);

  // Send via WhatsApp if user authenticated through WhatsApp
  if (user.authProvider === 'whatsapp' && user.whatsappPhone) {
    return await sendWhatsAppMessage(user.whatsappPhone, message);
  }

  // Send via Telegram if user authenticated through Telegram
  if (user.authProvider === 'telegram' && user.telegramId) {
    return await sendTelegramMessage(user.telegramId, message);
  }

  // For email users, try WhatsApp first (if they provided a phone), then fall back
  if (user.whatsappPhone) {
    return await sendWhatsAppMessage(user.whatsappPhone, message);
  }

  if (user.telegramId) {
    return await sendTelegramMessage(user.telegramId, message);
  }

  console.log('No messaging method available for user');
  return false;
}

/**
 * Sends appointment reminder (24 hours before)
 */
export async function sendAppointmentReminder(
  user: User | null,
  appointment: Appointment,
): Promise<boolean> {
  return await sendAppointmentConfirmation(user, appointment, 'reminder');
}

/**
 * Sends appointment cancellation notification
 */
export async function sendAppointmentCancellation(
  user: User | null,
  appointment: Appointment,
): Promise<boolean> {
  return await sendAppointmentConfirmation(user, appointment, 'cancellation');
}

/**
 * Utility function to find user by appointment details
 * Used when we only have appointment info but need to send messages
 */
export async function findUserForAppointment(appointment: Appointment): Promise<User | null> {
  // This would typically query the database to find the user
  // For now, we'll import the database function when needed
  const { findUserByEmail } = await import('../lib/database');
  const user = await findUserByEmail(appointment.customerEmail);

  if (!user) return null;

  // Convert Prisma types to app types
  return {
    ...user,
    role: user.role as 'CUSTOMER' | 'ADMIN',
    authProvider: (user.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
    telegramId: user.telegramId ?? undefined,
    whatsappPhone: user.whatsappPhone ?? undefined,
    avatar: user.avatar ?? undefined,
  };
}

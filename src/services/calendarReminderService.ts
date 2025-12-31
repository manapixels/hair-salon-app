/**
 * Calendar Reconnection Reminder Service
 *
 * Sends daily Telegram/WhatsApp reminders to stylists when their
 * Google Calendar connection expires, and success messages on reconnection.
 */

import type { Stylist, User } from '@/types';
import { sendWhatsAppMessage, sendTelegramMessage } from './messagingService';

export interface CalendarReminderResult {
  stylistId: string;
  stylistName: string;
  success: boolean;
  error?: string;
  method?: 'whatsapp' | 'telegram' | 'none';
}

/**
 * Send a calendar reconnection reminder to a stylist via their preferred channel
 */
export const sendCalendarReconnectReminder = async (
  stylist: Stylist,
  user: User,
): Promise<CalendarReminderResult> => {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://signaturetrims.com';
  const reconnectUrl = `${baseUrl}/dashboard?reconnect=calendar`;

  const message = `⚠️ *Google Calendar Disconnected*

Hi ${stylist.name}! Your Google Calendar connection has expired.

New appointments won't sync to your calendar until you reconnect.

👉 Reconnect here: ${reconnectUrl}

_This reminder will repeat daily until reconnected._`;

  try {
    if (user.authProvider === 'whatsapp' && user.whatsappPhone) {
      const success = await sendWhatsAppMessage(user.whatsappPhone, message);
      return {
        stylistId: stylist.id,
        stylistName: stylist.name,
        success,
        method: 'whatsapp',
        error: success ? undefined : 'Failed to send WhatsApp reminder',
      };
    } else if (user.authProvider === 'telegram' && user.telegramId) {
      const success = await sendTelegramMessage(user.telegramId, message);
      return {
        stylistId: stylist.id,
        stylistName: stylist.name,
        success,
        method: 'telegram',
        error: success ? undefined : 'Failed to send Telegram reminder',
      };
    } else {
      // Try both channels as fallback
      if (user.whatsappPhone) {
        const success = await sendWhatsAppMessage(user.whatsappPhone, message);
        if (success) {
          return {
            stylistId: stylist.id,
            stylistName: stylist.name,
            success: true,
            method: 'whatsapp',
          };
        }
      }

      if (user.telegramId) {
        const success = await sendTelegramMessage(user.telegramId, message);
        return {
          stylistId: stylist.id,
          stylistName: stylist.name,
          success,
          method: 'telegram',
          error: success ? undefined : 'Failed to send Telegram reminder',
        };
      }

      return {
        stylistId: stylist.id,
        stylistName: stylist.name,
        success: false,
        error: 'No valid contact method available',
        method: 'none',
      };
    }
  } catch (error) {
    return {
      stylistId: stylist.id,
      stylistName: stylist.name,
      success: false,
      error: `Reminder failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      method: 'none',
    };
  }
};

/**
 * Send a success message when calendar is reconnected
 */
export const sendCalendarReconnectSuccess = async (
  stylist: Stylist,
  user: User,
): Promise<CalendarReminderResult> => {
  const message = `✅ *Google Calendar Reconnected!*

Hi ${stylist.name}! Your calendar is now synced again.

Future appointments will appear on your Google Calendar automatically. ✨`;

  try {
    if (user.authProvider === 'whatsapp' && user.whatsappPhone) {
      const success = await sendWhatsAppMessage(user.whatsappPhone, message);
      return {
        stylistId: stylist.id,
        stylistName: stylist.name,
        success,
        method: 'whatsapp',
        error: success ? undefined : 'Failed to send WhatsApp success message',
      };
    } else if (user.authProvider === 'telegram' && user.telegramId) {
      const success = await sendTelegramMessage(user.telegramId, message);
      return {
        stylistId: stylist.id,
        stylistName: stylist.name,
        success,
        method: 'telegram',
        error: success ? undefined : 'Failed to send Telegram success message',
      };
    } else {
      // Try both channels as fallback
      if (user.whatsappPhone) {
        const success = await sendWhatsAppMessage(user.whatsappPhone, message);
        if (success) {
          return {
            stylistId: stylist.id,
            stylistName: stylist.name,
            success: true,
            method: 'whatsapp',
          };
        }
      }

      if (user.telegramId) {
        const success = await sendTelegramMessage(user.telegramId, message);
        return {
          stylistId: stylist.id,
          stylistName: stylist.name,
          success,
          method: 'telegram',
          error: success ? undefined : 'Failed to send Telegram success message',
        };
      }

      return {
        stylistId: stylist.id,
        stylistName: stylist.name,
        success: false,
        error: 'No valid contact method available',
        method: 'none',
      };
    }
  } catch (error) {
    return {
      stylistId: stylist.id,
      stylistName: stylist.name,
      success: false,
      error: `Success message failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      method: 'none',
    };
  }
};

/**
 * Send reminders to multiple stylists
 */
export const sendBulkCalendarReminders = async (
  stylistsWithUsers: Array<{ stylist: Stylist; user: User }>,
): Promise<CalendarReminderResult[]> => {
  const results: CalendarReminderResult[] = [];

  for (const { stylist, user } of stylistsWithUsers) {
    const result = await sendCalendarReconnectReminder(stylist, user);
    results.push(result);

    // Add a small delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
};

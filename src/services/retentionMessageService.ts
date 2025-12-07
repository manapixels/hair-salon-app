import {
  sendWhatsAppMessage,
  sendTelegramMessage,
  sendTelegramMessageWithKeyboard,
} from './messagingService';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logRetentionMessage } from './retentionService';
import { generateFeedbackKeyboard } from './messageTemplates';

export interface MessageResult {
  success: boolean;
  error?: string;
  method?: 'whatsapp' | 'telegram';
}

/**
 * Send retention message with error handling and delivery tracking
 */
export async function sendRetentionMessage(
  userId: string,
  message: string,
  messageType: 'FEEDBACK_REQUEST' | 'REBOOKING_NUDGE' | 'WIN_BACK',
  daysSinceLastVisit: number,
  appointmentId?: string,
): Promise<MessageResult> {
  const db = await getDb();

  const users = await db
    .select({
      telegramId: schema.users.telegramId,
      whatsappPhone: schema.users.whatsappPhone,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  const user = users[0];

  if (!user) {
    return {
      success: false,
      error: 'User not found',
    };
  }

  let success = false;
  let method: 'whatsapp' | 'telegram' | undefined;
  let error: string | undefined;

  try {
    // Try Telegram first if available
    if (user.telegramId) {
      if (messageType === 'FEEDBACK_REQUEST' && appointmentId) {
        const keyboard = generateFeedbackKeyboard(appointmentId);
        success = await sendTelegramMessageWithKeyboard(user.telegramId, message, keyboard);
      } else {
        success = await sendTelegramMessage(user.telegramId, message);
      }
      method = 'telegram';
    }
    // Fall back to WhatsApp
    else if (user.whatsappPhone) {
      success = await sendWhatsAppMessage(user.whatsappPhone, message);
      method = 'whatsapp';
    } else {
      error = 'No contact method available';
      success = false;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
    success = false;
  }

  // Log the delivery attempt
  await logRetentionMessage(
    userId,
    messageType,
    daysSinceLastVisit,
    success ? 'SENT' : 'FAILED',
    error,
  );

  return {
    success,
    error,
    method,
  };
}

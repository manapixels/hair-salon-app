import { sendWhatsAppMessage, sendTelegramMessage } from './messagingService';
import { prisma } from '@/lib/prisma';
import { logRetentionMessage } from './retentionService';

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
): Promise<MessageResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramId: true, whatsappPhone: true },
  });

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
      success = await sendTelegramMessage(user.telegramId, message);
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

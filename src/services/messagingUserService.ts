/**
 * Messaging User Service
 * Handles user identification and context for messaging platforms
 */
import { findUserByEmail, findAppointmentsByEmail } from '../lib/database';
import { prisma } from '../lib/prisma';
import type { User } from '../types';
import {
  addMessage,
  getHistory,
  setBookingContext,
  getBookingContext,
} from './conversationHistory';

/**
 * Find user by WhatsApp phone number
 */
export async function findUserByWhatsAppPhone(phone: string): Promise<User | null> {
  const dbUser = await prisma.user.findFirst({
    where: { whatsappPhone: phone },
  });

  if (!dbUser) return null;

  return {
    ...dbUser,
    role: dbUser.role as 'CUSTOMER' | 'ADMIN',
    authProvider: (dbUser.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
    telegramId: dbUser.telegramId ?? undefined,
    whatsappPhone: dbUser.whatsappPhone ?? undefined,
    avatar: dbUser.avatar ?? undefined,
  };
}

/**
 * Find user by Telegram ID
 */
export async function findUserByTelegramId(telegramId: number): Promise<User | null> {
  const dbUser = await prisma.user.findFirst({
    where: { telegramId: telegramId },
  });

  if (!dbUser) return null;

  return {
    ...dbUser,
    role: dbUser.role as 'CUSTOMER' | 'ADMIN',
    authProvider: (dbUser.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
    telegramId: dbUser.telegramId ?? undefined,
    whatsappPhone: dbUser.whatsappPhone ?? undefined,
    avatar: dbUser.avatar ?? undefined,
  };
}

/**
 * Enhanced message handler that includes user context
 */
export async function handleMessagingWithUserContext(
  message: string,
  platform: 'whatsapp' | 'telegram',
  platformId: string | number, // phone number for WhatsApp, chat ID for Telegram
): Promise<{
  reply: string;
  buttons?: Array<{ text: string; data: string }>;
  user: User | null;
  suggestedEmail?: string;
}> {
  // Try to identify the user
  let user: User | null = null;

  if (platform === 'whatsapp') {
    user = await findUserByWhatsAppPhone(platformId as string);
  } else if (platform === 'telegram') {
    user = await findUserByTelegramId(platformId as number);
  }

  // If we found a user, we can provide better context
  if (user) {
    // Check if they're asking about their appointments without providing email
    const appointmentKeywords = [
      'my appointments',
      'my booking',
      'change my appointment',
      'reschedule',
      'modify',
      'cancel my',
    ];
    const isAppointmentQuery = appointmentKeywords.some(keyword =>
      message.toLowerCase().includes(keyword),
    );

    if (isAppointmentQuery && !message.includes('@')) {
      // They're asking about appointments but didn't provide email
      // Let's enhance their message with their email
      const enhancedMessage = `${message} (my email is ${user.email})`;

      // Get conversation history
      const chatHistory = getHistory(platformId.toString());

      // Get booking context to inject into conversation
      const bookingContext = getBookingContext(platformId.toString());

      // If we have booking context, inject it into the conversation
      let enhancedChatHistory = [...chatHistory];
      if (bookingContext && (bookingContext.services || bookingContext.stylistId)) {
        let contextMessage = 'System Context: ';
        if (bookingContext.services && bookingContext.services.length > 0) {
          contextMessage += `User has selected service: ${bookingContext.services.join(', ')}. `;
        }
        if (bookingContext.stylistId) {
          contextMessage += `User has selected stylist ID: ${bookingContext.stylistId}. `;
        }
        contextMessage += 'Continue with the booking flow using this information.';
        enhancedChatHistory.push({ text: contextMessage, sender: 'bot' });
      }

      // Import and use the existing handler with user context
      const { handleWhatsAppMessage } = await import('./geminiService');
      const response = await handleWhatsAppMessage(
        enhancedMessage,
        enhancedChatHistory,
        {
          name: user.name,
          email: user.email,
        },
        bookingContext, // Pass booking context for validation
      );

      // Store the conversation
      addMessage(platformId.toString(), message, 'user');
      addMessage(platformId.toString(), response.text, 'bot');

      // Store booking context if present
      if (response.bookingDetails) {
        setBookingContext(platformId.toString(), response.bookingDetails);
      }

      return {
        reply: response.text,
        buttons: response.buttons,
        user,
        suggestedEmail: user.email,
      };
    }
  }

  // For regular queries, use the standard handler with user context if available
  const { handleWhatsAppMessage } = await import('./geminiService');
  const userContext = user ? { name: user.name, email: user.email } : null;

  // Get conversation history
  const chatHistory = getHistory(platformId.toString());

  // Get booking context to inject into conversation
  const bookingContext = getBookingContext(platformId.toString());

  // If we have booking context (service/stylist from button clicks), inject it into the conversation
  let enhancedChatHistory = [...chatHistory];
  if (bookingContext && (bookingContext.services || bookingContext.stylistId)) {
    // Add a system message to remind the AI about the current booking context
    let contextMessage = 'System Context: ';
    if (bookingContext.services && bookingContext.services.length > 0) {
      contextMessage += `User has selected service: ${bookingContext.services.join(', ')}. `;
    }
    if (bookingContext.stylistId) {
      contextMessage += `User has selected stylist ID: ${bookingContext.stylistId}. `;
    }
    contextMessage += 'Continue with the booking flow using this information.';

    enhancedChatHistory.push({ text: contextMessage, sender: 'bot' });
  }

  const response = await handleWhatsAppMessage(
    message,
    enhancedChatHistory,
    userContext,
    bookingContext, // Pass booking context for validation
  );

  // Store the conversation
  addMessage(platformId.toString(), message, 'user');
  addMessage(platformId.toString(), response.text, 'bot');

  // Store booking context if present
  if (response.bookingDetails) {
    setBookingContext(platformId.toString(), response.bookingDetails);
  }

  // If no user found and they're asking about appointments, suggest they provide email
  if (
    !user &&
    (message.toLowerCase().includes('appointment') || message.toLowerCase().includes('booking'))
  ) {
    const emailHint =
      '\n\n💡 *Tip:* To access your appointment information quickly, please include your email address in your message.';
    return {
      reply: response.text + emailHint,
      buttons: response.buttons,
      user: null,
    };
  }

  return {
    reply: response.text,
    buttons: response.buttons,
    user,
  };
}

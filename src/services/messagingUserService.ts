/**
 * Messaging User Service
 * Handles user identification and context for messaging platforms
 */
import { findUserByEmail, findAppointmentsByEmail } from '../lib/database';
import { getDb } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '../types';
import {
  addMessage,
  getHistory,
  setBookingContext,
  getBookingContext,
} from './conversationHistory';
import { Appointment } from '../types';

interface UserPattern {
  favoriteService?: string;
  favoriteStylistId?: string;
  typicalTime?: string; // e.g., "Sunday mornings"
}

/**
 * Analyze message for implicit feedback (sentiment)
 */
function analyzeSentiment(message: string): 'positive' | 'negative' | 'neutral' {
  const lower = message.toLowerCase();

  const positiveKeywords = ['thank', 'great', 'good', 'awesome', 'perfect', 'love', 'helpful'];
  const negativeKeywords = [
    'bad',
    'wrong',
    'stupid',
    'useless',
    'hate',
    'terrible',
    'human',
    'agent',
    'person',
  ];

  if (positiveKeywords.some(k => lower.includes(k))) return 'positive';
  if (negativeKeywords.some(k => lower.includes(k))) return 'negative';
  return 'neutral';
}

/**
 * Helper to calculate user patterns from past appointments
 */
export const calculateUserPattern = (appointments: any[]): UserPattern => {
  if (!appointments || appointments.length === 0) return {};

  const serviceCounts: Record<string, number> = {};
  const stylistCounts: Record<string, number> = {};
  const dayTimeCounts: Record<string, number> = {};

  appointments.forEach(apt => {
    // Count services
    if (Array.isArray(apt.services)) {
      apt.services.forEach((s: any) => {
        serviceCounts[s.name] = (serviceCounts[s.name] || 0) + 1;
      });
    }

    // Count stylists
    if (apt.stylistId) {
      stylistCounts[apt.stylistId] = (stylistCounts[apt.stylistId] || 0) + 1;
    }

    // Count day/time patterns (e.g., "Sunday Morning")
    const date = new Date(apt.date);
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = parseInt(apt.time.split(':')[0]);
    let timeOfDay = 'Afternoon';
    if (hour < 12) timeOfDay = 'Morning';
    else if (hour >= 17) timeOfDay = 'Evening';

    const key = `${day} ${timeOfDay}`;
    dayTimeCounts[key] = (dayTimeCounts[key] || 0) + 1;
  });

  // Find favorites
  const getTop = (counts: Record<string, number>) =>
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    favoriteService: getTop(serviceCounts),
    favoriteStylistId: getTop(stylistCounts),
    typicalTime: getTop(dayTimeCounts),
  };
};

/**
 * Find user by WhatsApp phone number
 */
export async function findUserByWhatsAppPhone(phone: string): Promise<User | null> {
  const db = await getDb();
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.whatsappPhone, phone))
    .limit(1);
  const dbUser = users[0];

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
  const db = await getDb();
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.telegramId, telegramId))
    .limit(1);
  const dbUser = users[0];

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
  media?: { mimeType: string; data: string; id: string },
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
      const bookingContext = await getBookingContext(platformId.toString());

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

      // Calculate user pattern
      let userPattern = {};
      try {
        const pastAppointments = await findAppointmentsByEmail(user.email);
        userPattern = calculateUserPattern(pastAppointments);
      } catch (e) {
        console.error('Failed to fetch appointments for pattern:', e);
      }

      const response = await handleWhatsAppMessage(
        enhancedMessage,
        enhancedChatHistory,
        {
          name: user.name,
          email: user.email,
        },
        bookingContext, // Pass booking context for validation
        userPattern,
        media,
      );

      // Implicit Feedback Monitoring
      const sentiment = analyzeSentiment(message);
      if (sentiment !== 'neutral') {
        console.log(
          `[Feedback] User ${user.email || platformId} sentiment: ${sentiment} (Message: "${message}")`,
        );
        // In a real app, we would store this in a database for analytics
      }

      // Store the conversation
      addMessage(platformId.toString(), message, 'user');
      addMessage(platformId.toString(), response.text, 'bot');

      // Store booking context if present
      if (response.bookingDetails) {
        await setBookingContext(platformId.toString(), response.bookingDetails);
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
  const bookingContext = await getBookingContext(platformId.toString());
  console.log('[DEBUG Context Load]', {
    platformId,
    bookingContext: JSON.stringify(bookingContext),
  });

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

  // Calculate user pattern if user is known
  let userPattern = {};
  if (user) {
    try {
      const pastAppointments = await findAppointmentsByEmail(user.email);
      userPattern = calculateUserPattern(pastAppointments);
    } catch (e) {
      console.error('Failed to fetch appointments for pattern:', e);
    }
  }

  const response = await handleWhatsAppMessage(
    message,
    enhancedChatHistory,
    userContext,
    bookingContext, // Pass booking context for validation
    userPattern,
    media,
  );

  // Implicit Feedback Monitoring
  const sentiment = analyzeSentiment(message);
  if (sentiment !== 'neutral') {
    console.log(
      `[Feedback] User ${user?.email || platformId} sentiment: ${sentiment} (Message: "${message}")`,
    );
    // In a real app, we would store this in a database for analytics
  }

  // Store the conversation
  addMessage(platformId.toString(), message, 'user');
  addMessage(platformId.toString(), response.text, 'bot');

  // Store booking context if present
  if (response.bookingDetails) {
    console.log('[DEBUG Context Save]', {
      platformId,
      bookingDetails: JSON.stringify(response.bookingDetails),
    });
    await setBookingContext(platformId.toString(), response.bookingDetails);
  } else {
    console.log('[DEBUG Context Save] No bookingDetails in response');
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

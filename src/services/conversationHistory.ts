/**
 * Conversation History Manager
 *
 * Stores recent conversation history for messaging platforms (WhatsApp, Telegram)
 * to maintain context between messages.
 *
 * NOTE: Flagged conversations are now persisted to database for production reliability.
 * Chat history still uses in-memory storage with auto-cleanup.
 */

import type { WhatsAppMessage } from '../types';
import { prisma } from '../lib/prisma';

// Store conversation history: userId -> messages
const history: Record<string, Pick<WhatsAppMessage, 'text' | 'sender'>[]> = {};

// Store booking context: userId -> booking details
interface BookingContext {
  customerName?: string;
  customerEmail?: string;
  services?: string[]; // Service names
  stylistId?: string; // Stylist ID
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  confirmed?: boolean;
  awaitingCustomDate?: boolean; // True when user is entering custom date via text
  // Favorite/last booking tracking for quick rebooking
  lastServiceBooked?: string; // Last service name
  lastStylistBooked?: string; // Last stylist ID
  lastBookingDate?: number; // Timestamp of last successful booking
  // Wizard-style UX: Track current step message for editing
  currentStepMessageId?: number; // Telegram message ID to edit on next step
  // Navigation history for Back button
  currentStep?: string; // Current step identifier
  stepHistory?: Array<{
    step: string;
    context: Partial<BookingContext>;
    timestamp: number;
  }>; // Stack of previous steps with their state
  currentWeekOffset?: number; // Week offset for date picker pagination (0 = current week)
  lastCommandOptions?: CommandOption[]; // Stored options for WhatsApp command replies
}

interface FlaggedState {
  isFlagged: boolean;
  reason?: string;
  timestamp?: number;
}

const bookingContexts: Record<string, BookingContext> = {};
const flaggedStates: Record<string, FlaggedState> = {};
const lastActivity: Record<string, number> = {};

export interface CommandOption {
  id: string; // Display index (e.g., "1", "2")
  label: string; // Human-readable label shown to the user
  callbackData: string; // Callback data used with botCommandService
}

// Maximum messages to keep per conversation (to prevent memory bloat)
const MAX_MESSAGES_PER_CONVERSATION = 20;

// Conversation timeout (30 minutes)
const TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Helper to check and clear old conversation data for a user.
 * Updates last activity timestamp.
 */
function checkTimeout(userId: string): void {
  const now = Date.now();
  if (lastActivity[userId] && now - lastActivity[userId] > TIMEOUT_MS) {
    delete history[userId];
    delete bookingContexts[userId];
    delete flaggedStates[userId];
    delete lastActivity[userId];
  }
  lastActivity[userId] = now;
}

/**
 * Add a message to the conversation history
 */
export function addMessage(userId: string, message: string, sender: 'user' | 'bot'): void {
  checkTimeout(userId);
  let userHistory = history[userId] || [];

  userHistory.push({ text: message, sender });

  // Keep only the last N messages
  if (userHistory.length > MAX_MESSAGES_PER_CONVERSATION) {
    userHistory = userHistory.slice(-MAX_MESSAGES_PER_CONVERSATION);
  }

  history[userId] = userHistory;
}

/**
 * Get conversation history for a user
 */
export function getHistory(userId: string): Pick<WhatsAppMessage, 'text' | 'sender'>[] {
  checkTimeout(userId);
  return history[userId] || [];
}

/**
 * Clear conversation history for a user
 */
export function clearHistory(userId: string): void {
  delete history[userId];
  delete lastActivity[userId];
  delete bookingContexts[userId];
  delete flaggedStates[userId];
}

/**
 * Set the booking context for a user
 */
export function setBookingContext(userId: string, context: Partial<BookingContext>): void {
  checkTimeout(userId);
  const existing = bookingContexts[userId] || {};
  bookingContexts[userId] = { ...existing, ...context };
}

/**
 * Get the booking context for a user
 */
export function getBookingContext(userId: string): BookingContext | null {
  checkTimeout(userId);
  return bookingContexts[userId] || null;
}

/**
 * Clear booking context
 */
export function clearBookingContext(userId: string): void {
  delete bookingContexts[userId];
}

// --- FLAGGING SYSTEM (DATABASE-BACKED) ---

export const flagConversation = async (
  userId: string,
  reason: string,
  platform: 'whatsapp' | 'telegram' = 'whatsapp',
) => {
  checkTimeout(userId);

  // Get last message from history
  const chatHistory = getHistory(userId);
  const lastMessage =
    chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].text : 'No message';

  try {
    // Create in database
    await prisma.flaggedConversation.create({
      data: {
        userId,
        platform,
        reason,
        lastMessage,
        isResolved: false,
      },
    });

    // Also update in-memory for backward compatibility
    flaggedStates[userId] = {
      isFlagged: true,
      reason,
      timestamp: Date.now(),
    };

    console.log(`[Conversation History] Flagged conversation for user ${userId}: ${reason}`);
  } catch (error) {
    console.error('Error flagging conversation in database:', error);
    // Fallback to in-memory only
    flaggedStates[userId] = {
      isFlagged: true,
      reason,
      timestamp: Date.now(),
    };
  }
};

export const resolveFlag = async (userId: string, resolvedBy?: string) => {
  checkTimeout(userId);

  try {
    // Update database
    await prisma.flaggedConversation.updateMany({
      where: {
        userId,
        isResolved: false,
      },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy,
      },
    });

    // Clear in-memory
    if (flaggedStates[userId]) {
      delete flaggedStates[userId];
    }

    console.log(`[Conversation History] Resolved flag for user ${userId}`);
  } catch (error) {
    console.error('Error resolving flag in database:', error);
    // Fallback: clear in-memory only
    if (flaggedStates[userId]) {
      delete flaggedStates[userId];
    }
  }
};

export const isFlagged = async (userId: string): Promise<boolean> => {
  checkTimeout(userId);

  try {
    // Check database first
    const dbFlag = await prisma.flaggedConversation.findFirst({
      where: {
        userId,
        isResolved: false,
      },
    });

    if (dbFlag) {
      return true;
    }

    // Fallback to in-memory
    return flaggedStates[userId]?.isFlagged || false;
  } catch (error) {
    console.error('Error checking flag in database:', error);
    // Fallback to in-memory
    return flaggedStates[userId]?.isFlagged || false;
  }
};

export const getFlagReason = async (userId: string): Promise<string | undefined> => {
  checkTimeout(userId);

  try {
    const dbFlag = await prisma.flaggedConversation.findFirst({
      where: {
        userId,
        isResolved: false,
      },
      orderBy: {
        flaggedAt: 'desc',
      },
    });

    if (dbFlag) {
      return dbFlag.reason;
    }

    // Fallback to in-memory
    return flaggedStates[userId]?.reason;
  } catch (error) {
    console.error('Error getting flag reason from database:', error);
    return flaggedStates[userId]?.reason;
  }
};

export const getAllFlaggedUsers = async (): Promise<string[]> => {
  try {
    const dbFlags = await prisma.flaggedConversation.findMany({
      where: {
        isResolved: false,
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    const dbUserIds = dbFlags.map(f => f.userId);

    // Merge with in-memory (for backwards compatibility during transition)
    const memoryUserIds = Object.keys(flaggedStates).filter(
      userId => flaggedStates[userId].isFlagged,
    );

    // Combine and deduplicate
    return Array.from(new Set([...dbUserIds, ...memoryUserIds]));
  } catch (error) {
    console.error('Error getting flagged users from database:', error);
    // Fallback to in-memory only
    return Object.keys(flaggedStates).filter(userId => flaggedStates[userId].isFlagged);
  }
};

/**
 * Store the latest selectable command options for a user (used by WhatsApp flows)
 */
export function setCommandOptions(userId: string, options: CommandOption[]): void {
  checkTimeout(userId);
  const existing = bookingContexts[userId] || {};
  bookingContexts[userId] = { ...existing, lastCommandOptions: options };
  lastActivity[userId] = Date.now();
}

/**
 * Retrieve the selectable command options for a user
 */
export function getCommandOptions(userId: string): CommandOption[] | undefined {
  return getBookingContext(userId)?.lastCommandOptions;
}

/**
 * Clear stored command options for a user
 */
/**
 * Clear stored command options for a user
 */
export function clearCommandOptions(userId: string): void {
  const existing = bookingContexts[userId];
  if (!existing || existing.lastCommandOptions === undefined) {
    return;
  }

  const { lastCommandOptions: _ignored, ...rest } = existing;
  bookingContexts[userId] = rest;
}

/**
 * Push a new step onto the navigation history
 */
export function pushStep(userId: string, step: string, context: Partial<BookingContext>): void {
  const current = getBookingContext(userId) || {};
  const history = current.stepHistory || [];

  // Add current step to history
  history.push({
    step,
    context: { ...context },
    timestamp: Date.now(),
  });

  // Update context with new step
  setBookingContext(userId, {
    ...current,
    currentStep: step,
    stepHistory: history,
  });
}

/**
 * Pop the last step from navigation history and restore its state
 * Returns the restored context, or null if no history exists
 */
export function popStep(userId: string): Partial<BookingContext> | null {
  const current = getBookingContext(userId);
  if (!current?.stepHistory || current.stepHistory.length === 0) {
    return null;
  }

  const history = [...current.stepHistory];
  const previousStep = history.pop();

  if (!previousStep) return null;

  // Restore the context from the previous step
  setBookingContext(userId, {
    ...previousStep.context,
    stepHistory: history,
    currentStep: previousStep.step,
  });

  return previousStep.context;
}

/**
 * Clear the step history for a user (e.g., after booking completion)
 */
export function clearStepHistory(userId: string): void {
  const current = getBookingContext(userId);
  if (current) {
    setBookingContext(userId, {
      ...current,
      stepHistory: [],
      currentStep: undefined,
    });
  }
}

/**
 * Export BookingContext type for use in other modules
 */
export type { BookingContext };

/**
 * Clean up old conversations (should be called periodically)
 */
export function cleanupOldConversations(): number {
  const now = Date.now();
  let cleaned = 0;

  Object.keys(lastActivity).forEach(userId => {
    if (now - lastActivity[userId] > TIMEOUT_MS) {
      delete history[userId];
      delete bookingContexts[userId];
      delete flaggedStates[userId];
      delete lastActivity[userId];
      cleaned++;
    }
  });

  return cleaned;
}

// Run cleanup every 10 minutes
setInterval(
  () => {
    const cleaned = cleanupOldConversations();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} old conversations`);
    }
  },
  10 * 60 * 1000,
);

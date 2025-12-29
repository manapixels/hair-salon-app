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
import { getDb } from '../db';
import * as schema from '../db/schema';
import { eq, and, desc, gt, lt } from 'drizzle-orm';

// Store conversation history: userId -> messages
const history: Record<string, Pick<WhatsAppMessage, 'text' | 'sender'>[]> = {};

// Store booking context: userId -> booking details
interface BookingContext {
  customerName?: string;
  customerEmail?: string;
  // Category-based booking (new)
  categoryId?: string; // Category ID (e.g., 'haircut')
  categoryName?: string; // Display name (e.g., 'Haircut')
  priceNote?: string; // e.g., 'from $28'
  // Legacy service-based (for compatibility)
  services?: string[]; // Service names
  stylistId?: string; // Stylist ID
  stylistName?: string; // Stylist display name
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  confirmed?: boolean;
  awaitingCustomDate?: boolean; // True when user is entering custom date via text
  awaitingInput?:
    | 'category'
    | 'date'
    | 'time'
    | 'stylist'
    | 'confirmation'
    | 'email'
    | 'appointment_select'; // Current step for conversational flow
  // For cancel/reschedule flows
  pendingAction?: 'cancel' | 'reschedule' | 'view';
  appointmentId?: string;
  newDate?: string;
  newTime?: string;
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

// In-memory cache for same-request performance (short TTL)
const sessionCache: Map<string, { context: BookingContext; timestamp: number }> = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache for same-request performance

// Session expiry (30 minutes)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Helper to clear in-memory cache for a user
 */
function clearCache(chatId: string, platform: string = 'telegram'): void {
  sessionCache.delete(`${chatId}_${platform}`);
}

/**
 * Legacy helper for chat history timeout check (in-memory only)
 * Updates last activity timestamp.
 */
function checkTimeout(userId: string): void {
  const now = Date.now();
  if (lastActivity[userId] && now - lastActivity[userId] > TIMEOUT_MS) {
    delete history[userId];
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
 * Set/update the booking context for a user (DATABASE-BACKED)
 * Creates a new session or updates existing one
 */
export async function setBookingContext(
  chatId: string,
  context: Partial<BookingContext>,
  platform: 'telegram' | 'whatsapp' = 'telegram',
): Promise<void> {
  const cacheKey = `${chatId}_${platform}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_MS);

  try {
    const db = await getDb();

    // Check if session exists
    const existingSessions = await db
      .select()
      .from(schema.conversationSessions)
      .where(
        and(
          eq(schema.conversationSessions.chatId, chatId),
          eq(schema.conversationSessions.platform, platform),
        ),
      )
      .limit(1);

    if (existingSessions.length > 0) {
      // Merge with existing context and update
      const existingContext = (existingSessions[0].context as BookingContext) || {};
      const mergedContext = { ...existingContext, ...context };

      await db
        .update(schema.conversationSessions)
        .set({
          context: mergedContext,
          lastActivityAt: now,
          expiresAt: expiresAt,
        })
        .where(eq(schema.conversationSessions.id, existingSessions[0].id));

      // Update cache
      sessionCache.set(cacheKey, { context: mergedContext, timestamp: Date.now() });
    } else {
      // Create new session
      const newContext = { ...context } as BookingContext;

      await db.insert(schema.conversationSessions).values({
        chatId,
        platform,
        context: newContext,
        lastActivityAt: now,
        expiresAt: expiresAt,
      });

      // Update cache
      sessionCache.set(cacheKey, { context: newContext, timestamp: Date.now() });
    }
  } catch (error) {
    console.error('[ConversationHistory] Error setting booking context:', error);
    // Don't throw - allow graceful degradation
  }
}

/**
 * Get the booking context for a user (DATABASE-BACKED)
 * Returns null if no session exists or session expired
 */
export async function getBookingContext(
  chatId: string,
  platform: 'telegram' | 'whatsapp' = 'telegram',
): Promise<BookingContext | null> {
  const cacheKey = `${chatId}_${platform}`;

  // 1. Check in-memory cache first (for same-request performance)
  const cached = sessionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.context;
  }

  try {
    const db = await getDb();

    // 2. Fetch from database (only non-expired sessions)
    const sessions = await db
      .select()
      .from(schema.conversationSessions)
      .where(
        and(
          eq(schema.conversationSessions.chatId, chatId),
          eq(schema.conversationSessions.platform, platform),
          gt(schema.conversationSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (sessions.length === 0) {
      sessionCache.delete(cacheKey);
      return null;
    }

    // 3. Update cache and return
    const context = sessions[0].context as BookingContext;
    sessionCache.set(cacheKey, { context, timestamp: Date.now() });
    return context;
  } catch (error) {
    console.error('[ConversationHistory] Error getting booking context:', error);
    return null;
  }
}

/**
 * Clear booking context (DATABASE-BACKED)
 */
export async function clearBookingContext(
  chatId: string,
  platform: 'telegram' | 'whatsapp' = 'telegram',
): Promise<void> {
  clearCache(chatId, platform);

  try {
    const db = await getDb();

    await db
      .delete(schema.conversationSessions)
      .where(
        and(
          eq(schema.conversationSessions.chatId, chatId),
          eq(schema.conversationSessions.platform, platform),
        ),
      );
  } catch (error) {
    console.error('[ConversationHistory] Error clearing booking context:', error);
  }
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
    const db = await getDb();
    // Create in database
    await db.insert(schema.flaggedConversations).values({
      userId,
      platform,
      reason,
      lastMessage,
      isResolved: false,
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
    const db = await getDb();
    // Get all unresolved flags for this user and update them
    const unresolvedFlags = await db
      .select()
      .from(schema.flaggedConversations)
      .where(
        and(
          eq(schema.flaggedConversations.userId, userId),
          eq(schema.flaggedConversations.isResolved, false),
        ),
      );

    for (const flag of unresolvedFlags) {
      await db
        .update(schema.flaggedConversations)
        .set({ isResolved: true, resolvedAt: new Date(), resolvedBy })
        .where(eq(schema.flaggedConversations.id, flag.id));
    }

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
    const db = await getDb();
    // Check database first
    const dbFlags = await db
      .select()
      .from(schema.flaggedConversations)
      .where(
        and(
          eq(schema.flaggedConversations.userId, userId),
          eq(schema.flaggedConversations.isResolved, false),
        ),
      )
      .limit(1);

    if (dbFlags.length > 0) {
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
    const db = await getDb();
    const dbFlags = await db
      .select()
      .from(schema.flaggedConversations)
      .where(
        and(
          eq(schema.flaggedConversations.userId, userId),
          eq(schema.flaggedConversations.isResolved, false),
        ),
      )
      .orderBy(desc(schema.flaggedConversations.flaggedAt))
      .limit(1);

    if (dbFlags.length > 0) {
      return dbFlags[0].reason;
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
    const db = await getDb();
    const dbFlags = await db
      .select({ userId: schema.flaggedConversations.userId })
      .from(schema.flaggedConversations)
      .where(eq(schema.flaggedConversations.isResolved, false));

    // Get unique user IDs
    const dbUserIds = Array.from(new Set(dbFlags.map(f => f.userId)));

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
export async function setCommandOptions(
  chatId: string,
  options: CommandOption[],
  platform: 'telegram' | 'whatsapp' = 'telegram',
): Promise<void> {
  await setBookingContext(chatId, { lastCommandOptions: options }, platform);
}

/**
 * Retrieve the selectable command options for a user
 */
export async function getCommandOptions(
  chatId: string,
  platform: 'telegram' | 'whatsapp' = 'telegram',
): Promise<CommandOption[] | undefined> {
  const context = await getBookingContext(chatId, platform);
  return context?.lastCommandOptions;
}

/**
 * Clear stored command options for a user
 */
export async function clearCommandOptions(
  chatId: string,
  platform: 'telegram' | 'whatsapp' = 'telegram',
): Promise<void> {
  const context = await getBookingContext(chatId, platform);
  if (!context || context.lastCommandOptions === undefined) {
    return;
  }

  const { lastCommandOptions: _ignored, ...rest } = context;
  // Replace entire context without lastCommandOptions
  const db = await getDb();
  await db
    .update(schema.conversationSessions)
    .set({
      context: rest,
      lastActivityAt: new Date(),
    })
    .where(
      and(
        eq(schema.conversationSessions.chatId, chatId),
        eq(schema.conversationSessions.platform, platform),
      ),
    );
  clearCache(chatId, platform);
}

/**
 * Push a new step onto the navigation history
 */
export async function pushStep(
  chatId: string,
  step: string,
  context: Partial<BookingContext>,
  platform: 'telegram' | 'whatsapp' = 'telegram',
): Promise<void> {
  const current = (await getBookingContext(chatId, platform)) || {};
  const stepHistory = current.stepHistory || [];

  // Add current step to history
  stepHistory.push({
    step,
    context: { ...context },
    timestamp: Date.now(),
  });

  // Update context with new step
  await setBookingContext(
    chatId,
    {
      currentStep: step,
      stepHistory: stepHistory,
    },
    platform,
  );
}

/**
 * Pop the last step from navigation history and restore its state
 * Returns the restored context, or null if no history exists
 */
export async function popStep(
  chatId: string,
  platform: 'telegram' | 'whatsapp' = 'telegram',
): Promise<Partial<BookingContext> | null> {
  const current = await getBookingContext(chatId, platform);
  if (!current?.stepHistory || current.stepHistory.length === 0) {
    return null;
  }

  const stepHistory = [...current.stepHistory];
  const previousStep = stepHistory.pop();

  if (!previousStep) return null;

  // Restore the context from the previous step
  await setBookingContext(
    chatId,
    {
      ...previousStep.context,
      stepHistory: stepHistory,
      currentStep: previousStep.step,
    },
    platform,
  );

  return previousStep.context;
}

/**
 * Clear the step history for a user (e.g., after booking completion)
 */
export async function clearStepHistory(
  chatId: string,
  platform: 'telegram' | 'whatsapp' = 'telegram',
): Promise<void> {
  const current = await getBookingContext(chatId, platform);
  if (current) {
    await setBookingContext(
      chatId,
      {
        stepHistory: [],
        currentStep: undefined,
      },
      platform,
    );
  }
}

/**
 * Export BookingContext type for use in other modules
 */
export type { BookingContext };

/**
 * Format date for display (simple version)
 */
function formatDisplayDateSimple(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format time for display (12-hour)
 */
function formatTime12HourSimple(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Generates the "Current Booking" summary to prepend to messages
 * Used for progressive confirmation display in conversational flow
 */
export function generateBookingSummary(context: BookingContext | null): string {
  if (!context) return '';

  // Need at least a category/service to show summary
  const hasCategory = context.categoryName || (context.services && context.services.length > 0);
  if (!hasCategory) return '';

  const lines: string[] = ['✅ *Your Booking:*'];

  // Category/Service with price
  if (context.categoryName) {
    lines.push(`✂️ ${context.categoryName}${context.priceNote ? ` (${context.priceNote})` : ''}`);
  } else if (context.services && context.services.length > 0) {
    lines.push(`✂️ ${context.services.join(', ')}`);
  }

  // Date (if confirmed)
  if (context.date) {
    lines.push(`📅 ${formatDisplayDateSimple(context.date)}`);
  }

  // Time (if confirmed)
  if (context.time) {
    lines.push(`🕐 ${formatTime12HourSimple(context.time)}`);
  }

  // Stylist (if confirmed)
  if (context.stylistId) {
    const stylistDisplay =
      context.stylistId === 'any'
        ? 'Any available stylist'
        : context.stylistName || context.stylistId;
    lines.push(`👤 ${stylistDisplay}`);
  }

  return lines.join('\n') + '\n\n';
}

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

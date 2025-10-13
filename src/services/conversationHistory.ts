/**
 * Conversation History Manager
 *
 * Stores recent conversation history for messaging platforms (WhatsApp, Telegram)
 * to maintain context between messages.
 *
 * NOTE: This uses in-memory storage. For production, consider:
 * - Redis for distributed/serverless environments
 * - Database for persistent history
 */

import type { WhatsAppMessage } from '../types';

// Store conversation history: userId -> messages
const conversationStore = new Map<string, Pick<WhatsAppMessage, 'text' | 'sender'>[]>();

// Maximum messages to keep per conversation (to prevent memory bloat)
const MAX_MESSAGES_PER_CONVERSATION = 20;

// Conversation timeout (30 minutes)
const CONVERSATION_TIMEOUT_MS = 30 * 60 * 1000;

// Track last activity time for each conversation
const lastActivityStore = new Map<string, number>();

/**
 * Add a message to the conversation history
 */
export function addMessage(userId: string, message: string, sender: 'user' | 'assistant'): void {
  let history = conversationStore.get(userId) || [];

  history.push({ text: message, sender });

  // Keep only the last N messages
  if (history.length > MAX_MESSAGES_PER_CONVERSATION) {
    history = history.slice(-MAX_MESSAGES_PER_CONVERSATION);
  }

  conversationStore.set(userId, history);
  lastActivityStore.set(userId, Date.now());
}

/**
 * Get conversation history for a user
 */
export function getHistory(userId: string): Pick<WhatsAppMessage, 'text' | 'sender'>[] {
  // Check if conversation has timed out
  const lastActivity = lastActivityStore.get(userId);
  if (lastActivity && Date.now() - lastActivity > CONVERSATION_TIMEOUT_MS) {
    // Clear old conversation
    conversationStore.delete(userId);
    lastActivityStore.delete(userId);
    return [];
  }

  return conversationStore.get(userId) || [];
}

/**
 * Clear conversation history for a user
 */
export function clearHistory(userId: string): void {
  conversationStore.delete(userId);
  lastActivityStore.delete(userId);
}

/**
 * Clean up old conversations (should be called periodically)
 */
export function cleanupOldConversations(): number {
  const now = Date.now();
  let cleaned = 0;

  lastActivityStore.forEach((lastActivity, userId) => {
    if (now - lastActivity > CONVERSATION_TIMEOUT_MS) {
      conversationStore.delete(userId);
      lastActivityStore.delete(userId);
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

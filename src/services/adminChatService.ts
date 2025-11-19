import {
  isFlagged,
  getFlagReason,
  resolveFlag as resolveFlagInHistory,
  getAllFlaggedUsers,
} from './conversationHistory';
import { addMessage, getHistory } from './conversationHistory';
import { sendWhatsAppMessage } from './messagingService';

export interface FlaggedConversation {
  userId: string;
  reason: string;
  lastMessage: string;
  timestamp: number;
  platform: 'whatsapp' | 'telegram'; // Inferred from ID or context
}

/**
 * Get all currently flagged conversations from database
 */
export const getFlaggedConversations = async (): Promise<FlaggedConversation[]> => {
  const flaggedUsers = await getAllFlaggedUsers();
  const conversations: FlaggedConversation[] = [];

  for (const userId of flaggedUsers) {
    const history = getHistory(userId);
    const lastMessage = history.length > 0 ? history[history.length - 1].text : '';
    const reason = (await getFlagReason(userId)) || 'Unknown';

    conversations.push({
      userId,
      reason,
      lastMessage,
      timestamp: Date.now(),
      platform: userId.includes('@') ? 'whatsapp' : 'telegram', // Rough heuristic
    });
  }

  return conversations;
};

/**
 * Get chat history for a specific user
 */
export const getConversationHistory = async (userId: string) => {
  return getHistory(userId);
};

/**
 * Resolve a flagged conversation
 */
export const resolveFlag = async (userId: string) => {
  resolveFlagInHistory(userId);
};

/**
 * Send a reply to a user (admin intervention)
 */
export const sendAdminReply = async (userId: string, message: string) => {
  // 1. Send message via appropriate platform
  // For now, defaulting to WhatsApp as that's our primary
  await sendWhatsAppMessage(userId, message);

  // 2. Add to history
  addMessage(userId, message, 'bot');

  // 3. Resolve flag automatically when admin replies?
  // Usually yes, but maybe admin wants to keep it open.
  // Let's assume yes for "Smart Handoff" flow.
  resolveFlagInHistory(userId);
};

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { toast } from 'sonner';
import { WhatsAppIcon, TelegramIcon } from '@/lib/icons';
import { Spinner } from '@/components/ui/spinner';

interface FlaggedConversation {
  userId: string;
  reason: string;
  lastMessage: string;
  timestamp: number;
  platform: 'whatsapp' | 'telegram';
}

export default function ChatDashboard() {
  const [conversations, setConversations] = useState<FlaggedConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchConversations();
    // Poll every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/admin/chat');
      if (response.ok) {
        const data = (await response.json()) as FlaggedConversation[];
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedUser || !replyMessage.trim()) return;

    try {
      setIsSending(true);
      const response = await fetch('/api/admin/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          message: replyMessage,
          resolve: true, // Auto-resolve on reply
        }),
      });

      if (response.ok) {
        toast.success('Reply sent');
        setReplyMessage('');
        setSelectedUser(null);
        fetchConversations(); // Refresh list
      } else {
        toast.error('Failed to send reply');
      }
    } catch (error) {
      toast.error('Error sending reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleResolve = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: '', // No message, just resolve
          resolve: true,
        }),
      });

      if (response.ok) {
        toast.success('Conversation resolved');
        if (selectedUser === userId) setSelectedUser(null);
        fetchConversations();
      }
    } catch (error) {
      toast.error('Error resolving conversation');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Sidebar List */}
      <div className="lg:col-span-1 border-r pr-4 overflow-y-auto">
        <h3 className="font-semibold mb-4 text-gray-700">Flagged Conversations</h3>
        {isLoading ? (
          <LoadingSpinner />
        ) : conversations.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8">No flagged conversations</div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => (
              <div
                key={conv.userId}
                onClick={() => setSelectedUser(conv.userId)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUser === conv.userId
                    ? 'bg-primary/10 border-primary border'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center space-x-2">
                    {conv.platform === 'whatsapp' ? (
                      <WhatsAppIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <TelegramIcon className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="font-medium text-sm truncate w-32">{conv.userId}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(conv.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-red-500 font-medium mb-1">Reason: {conv.reason}</p>
                <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-2 flex flex-col h-full">
        {selectedUser ? (
          <>
            <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto border">
              <div className="text-center text-sm text-gray-500 mb-4">
                Replying to {selectedUser}
              </div>
              {/* Here we could fetch and show full history if we had an API for it */}
              <div className="bg-white p-3 rounded-lg shadow-sm max-w-[80%] mb-2">
                <p className="text-sm text-gray-800">
                  {conversations.find(c => c.userId === selectedUser)?.lastMessage}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                rows={3}
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
              />
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => handleResolve(selectedUser)}>
                  Resolve without Reply
                </Button>
                <Button onClick={handleReply} disabled={!replyMessage.trim()}>
                  {isSending && <Spinner className="mr-2" />}
                  Send Reply & Resolve
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>Select a conversation to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

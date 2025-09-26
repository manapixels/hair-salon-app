import { useState, useRef, useEffect } from 'react';
import type { WhatsAppMessage } from '../types';

const WhatsAppChat: React.FC = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([
    {
      id: '1',
      text: 'Welcome to Luxe Cuts! How can I help you today? You can ask about our services, book, or cancel an appointment.',
      sender: 'bot',
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage: WhatsAppMessage = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const loadingMessage: WhatsAppMessage = {
      id: 'loading',
      text: '',
      sender: 'bot',
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: input,
          chatHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const { reply } = await response.json();

      const botMessage: WhatsAppMessage = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: 'bot',
      };
      setMessages(prev => [...prev.filter(m => m.id !== 'loading'), botMessage]);
    } catch (error) {
      console.error('Error handling WhatsApp message:', error);
      const errorMessage: WhatsAppMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
      };
      setMessages(prev => [...prev.filter(m => m.id !== 'loading'), errorMessage]);
    }
  };

  const MessageBubble: React.FC<{ message: WhatsAppMessage }> = ({ message }) => {
    const isUser = message.sender === 'user';
    if (message.isLoading) {
      return (
        <div className="flex justify-start">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 max-w-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`${isUser ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-700'} rounded-lg p-3 max-w-sm whitespace-pre-wrap`}
        >
          {message.text}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[75vh] max-w-2xl mx-auto bg-gray-200 dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden">
      <div className="bg-green-800 text-white p-3 flex items-center">
        <i className="fa-solid fa-scissors text-2xl mr-3"></i>
        <div>
          <h3 className="font-bold">Luxe Cuts Assistant</h3>
          <p className="text-xs">Online</p>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-100 dark:bg-gray-800">
        <div className="text-center p-3 mb-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-lg text-sm shadow-sm">
          <p>
            <i className="fa-solid fa-circle-info mr-2"></i>This is a simulation of our AI
            assistant. You can test its capabilities here, or use the QR code in the &quot;Book
            Online&quot; tab to chat on your own WhatsApp!
          </p>
        </div>
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-white dark:bg-gray-700 flex items-center">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-full bg-gray-100 dark:bg-gray-600 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleSend}
          className="ml-3 bg-green-600 text-white p-3 rounded-full hover:bg-green-700"
        >
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default WhatsAppChat;

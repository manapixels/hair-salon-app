'use client';

import { useEffect, useState } from 'react';
import TelegramLoginWidget from './TelegramLoginWidget';

interface OAuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OAuthLoginModal({ isOpen, onClose }: OAuthLoginModalProps) {
  const [telegramBotUsername, setTelegramBotUsername] = useState<string | null>(null);
  const [showTelegramWidget, setShowTelegramWidget] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !telegramBotUsername) {
      // Fetch Telegram bot info when modal opens
      fetch('/api/auth/telegram')
        .then(res => res.json())
        .then(data => {
          if (data.botUsername) {
            setTelegramBotUsername(data.botUsername);
          }
        })
        .catch(err => console.error('Failed to fetch Telegram bot info:', err));
    }
  }, [isOpen, telegramBotUsername]);

  const handleWhatsAppLogin = () => {
    // Redirect to server-side WhatsApp OAuth initiation
    window.location.href = '/api/auth/whatsapp';
  };

  const handleTelegramLogin = () => {
    setShowTelegramWidget(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>

          <div className="space-y-4">
            {showTelegramWidget ? (
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Click the Telegram button below to sign in:
                </p>
                {telegramBotUsername && (
                  <TelegramLoginWidget
                    botUsername={telegramBotUsername}
                    buttonSize="large"
                    className="flex justify-center"
                  />
                )}
                <button
                  onClick={() => setShowTelegramWidget(false)}
                  className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mt-4"
                >
                  ← Back to options
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  Sign in with your preferred messaging platform
                </p>

                {/* WhatsApp Login Button */}
                <button
                  onClick={handleWhatsAppLogin}
                  className="w-full flex items-center justify-center space-x-3 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  <i className="fa-brands fa-whatsapp text-xl"></i>
                  <span>Continue with WhatsApp</span>
                </button>

                {/* Telegram Login Button */}
                <button
                  onClick={handleTelegramLogin}
                  className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  disabled={!telegramBotUsername}
                >
                  <i className="fa-brands fa-telegram text-xl"></i>
                  <span>Continue with Telegram</span>
                </button>
              </>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

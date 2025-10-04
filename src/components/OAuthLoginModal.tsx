'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import TelegramLoginWidget from './TelegramLoginWidget';
import WhatsAppOTPLogin from './WhatsAppOTPLogin';
import { LoadingButton } from './loaders/LoadingButton';
import { ErrorState } from './ErrorState';

interface OAuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OAuthLoginModal({ isOpen, onClose }: OAuthLoginModalProps) {
  const [telegramBotUsername, setTelegramBotUsername] = useState<string | null>(null);
  const [showTelegramWidget, setShowTelegramWidget] = useState(false);
  const [showWhatsAppOTP, setShowWhatsAppOTP] = useState(false);
  const [loadingTelegram, setLoadingTelegram] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);

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
    if (isOpen && !telegramBotUsername && !loadingTelegram) {
      // Fetch Telegram bot info when modal opens
      setLoadingTelegram(true);
      setTelegramError(null);

      fetch('/api/auth/telegram')
        .then(res => {
          if (!res.ok) throw new Error('Failed to load Telegram configuration');
          return res.json();
        })
        .then(data => {
          if (data.botUsername) {
            setTelegramBotUsername(data.botUsername);
          } else {
            throw new Error('Telegram bot not configured');
          }
        })
        .catch(err => {
          console.error('Failed to fetch Telegram bot info:', err);
          const errorMsg = err instanceof Error ? err.message : 'Failed to load Telegram login';
          setTelegramError(errorMsg);
          toast.error(errorMsg);
        })
        .finally(() => {
          setLoadingTelegram(false);
        });
    }
  }, [isOpen, telegramBotUsername, loadingTelegram]);

  const handleWhatsAppLogin = () => {
    setShowWhatsAppOTP(true);
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
            {showWhatsAppOTP ? (
              <WhatsAppOTPLogin onSuccess={onClose} onBack={() => setShowWhatsAppOTP(false)} />
            ) : showTelegramWidget ? (
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
                <LoadingButton
                  onClick={handleTelegramLogin}
                  disabled={!telegramBotUsername || !!telegramError}
                  loading={loadingTelegram}
                  loadingText="Loading Telegram..."
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  <i className="fa-brands fa-telegram text-xl"></i>
                  <span>Continue with Telegram</span>
                </LoadingButton>

                {/* Telegram Error State */}
                {telegramError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{telegramError}</span>
                    </p>
                    <button
                      onClick={() => {
                        setTelegramError(null);
                        setTelegramBotUsername(null); // Trigger refetch
                      }}
                      className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
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

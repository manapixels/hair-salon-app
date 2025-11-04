'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import TelegramLoginWidget from './TelegramLoginWidget';
import WhatsAppOTPLogin from './WhatsAppOTPLogin';
import { Button, Dialog } from '@radix-ui/themes';

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
    if (!isOpen) {
      setShowTelegramWidget(false);
      setShowWhatsAppOTP(false);
      return;
    }

    if (!telegramBotUsername && !loadingTelegram) {
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
    setShowTelegramWidget(previous => !previous);
  };
  return (
    <Dialog.Root open={isOpen} onOpenChange={open => (!open ? onClose() : undefined)}>
      <Dialog.Content className="max-w-lg space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Dialog.Title>Sign In</Dialog.Title>
            <Dialog.Description>
              Choose your preferred messaging platform to continue to Luxe Cuts.
            </Dialog.Description>
          </div>
          <Dialog.Close>
            <Button variant="ghost" className="h-10 w-10 rounded-full p-0 text-gray-500">
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              <span className="sr-only">Close sign in modal</span>
            </Button>
          </Dialog.Close>
        </div>

        {showWhatsAppOTP ? (
          <WhatsAppOTPLogin onSuccess={onClose} onBack={() => setShowWhatsAppOTP(false)} />
        ) : (
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Sign in with your preferred messaging platform
            </p>

            <Button
              onClick={handleWhatsAppLogin}
              className="w-full border border-[#1ebe5d] bg-[#25D366] text-white hover:bg-[#1ebe5d]"
            >
              <i className="fa-brands fa-whatsapp text-lg" aria-hidden="true"></i>
              Continue with WhatsApp
            </Button>

            <Button
              onClick={handleTelegramLogin}
              loading={loadingTelegram}
              disabled={!telegramBotUsername || !!telegramError}
              className="w-full bg-[#0088cc] text-white hover:bg-[#007ab8] disabled:bg-[#8ccae8]"
            >
              <i className="fa-brands fa-telegram text-lg" aria-hidden="true"></i>
              {showTelegramWidget ? 'Hide Telegram' : 'Continue with Telegram'}
            </Button>

            {showTelegramWidget && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-900/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                      Ready to sign in with Telegram?
                    </h3>
                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                      A new tab will open. Tap <span className="font-semibold">Start</span> in the
                      bot chat to finish logging in.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-8 px-3 text-xs text-blue-700"
                    onClick={() => setShowTelegramWidget(false)}
                  >
                    Close
                  </Button>
                </div>

                <div className="mt-4 flex justify-center">
                  {telegramBotUsername ? (
                    <TelegramLoginWidget
                      botUsername={telegramBotUsername}
                      buttonSize="large"
                      className="flex justify-center"
                    />
                  ) : (
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Loading Telegram login...
                    </p>
                  )}
                </div>
              </div>
            )}

            {telegramError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{telegramError}</span>
                </p>
                <Button
                  variant="ghost"
                  className="mt-2 h-8 px-3 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                  onClick={() => {
                    setTelegramError(null);
                    setTelegramBotUsername(null);
                  }}
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-gray-200 pt-4 text-center dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}

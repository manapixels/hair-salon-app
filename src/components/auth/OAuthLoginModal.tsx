'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import TelegramLoginWidget from './TelegramLoginWidget';
import WhatsAppOTPLogin from './WhatsAppOTPLogin';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WhatsAppIcon, TelegramIcon } from '@/lib/icons';
import { Button } from '@/components/ui/button';

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
    <Dialog open={isOpen} onOpenChange={open => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-lg space-y-6">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <DialogTitle>Sign In</DialogTitle>
            <DialogDescription>
              Choose your preferred messaging platform to continue to Signature Trims.
            </DialogDescription>
          </div>
        </DialogHeader>

        {showWhatsAppOTP ? (
          <WhatsAppOTPLogin onSuccess={onClose} onBack={() => setShowWhatsAppOTP(false)} />
        ) : (
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-600">
              Sign in with your preferred messaging platform
            </p>

            <Button
              onClick={handleWhatsAppLogin}
              className="w-full border border-[#1ebe5d] bg-[#25D366] text-white hover:bg-[#1ebe5d]"
            >
              <WhatsAppIcon className="h-5 w-5 mr-2" />
              Continue with WhatsApp
            </Button>

            <Button
              onClick={handleTelegramLogin}
              disabled={!telegramBotUsername || !!telegramError || loadingTelegram}
              className="w-full bg-[#0088cc] text-white hover:bg-[#007ab8] disabled:bg-[#8ccae8]"
            >
              <TelegramIcon className="h-5 w-5 mr-2" />
              {showTelegramWidget ? 'Hide Telegram' : 'Continue with Telegram'}
            </Button>

            {showTelegramWidget && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-800">
                      Ready to sign in with Telegram?
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      A new tab will open. Tap <span className="font-semibold">Start</span> in the
                      bot chat to finish logging in.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-8 px-3 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-100"
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
                    <p className="text-sm text-blue-700">Loading Telegram login...</p>
                  )}
                </div>
              </div>
            )}

            {telegramError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="flex items-center gap-2 text-sm text-red-700">
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
                  className="mt-2 h-8 px-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-100"
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

        <div className="border-t border-gray-200 pt-4 text-center">
          <p className="text-sm text-gray-500">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

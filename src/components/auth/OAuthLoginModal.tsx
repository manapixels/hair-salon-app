'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
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
import { ArrowLeft } from 'lucide-react';

interface OAuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LoginView = 'selection' | 'whatsapp' | 'telegram';

export default function OAuthLoginModal({ isOpen, onClose }: OAuthLoginModalProps) {
  const t = useTranslations('OAuthLoginModal');
  const [view, setView] = useState<LoginView>('selection');

  // Telegram specific state
  const [telegramBotUsername, setTelegramBotUsername] = useState<string | null>(null);
  const [loadingTelegram, setLoadingTelegram] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);

  // Reset view when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setView('selection'), 300); // Reset after transition
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Fetch Telegram bot info when entering Telegram view or if missing
  useEffect(() => {
    if (isOpen && !telegramBotUsername && !loadingTelegram) {
      setLoadingTelegram(true);
      setTelegramError(null);

      fetch('/api/auth/telegram')
        .then(res => {
          if (!res.ok) throw new Error('Failed to load Telegram configuration');
          return res.json() as Promise<{ botUsername?: string }>;
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
        })
        .finally(() => {
          setLoadingTelegram(false);
        });
    }
  }, [isOpen, telegramBotUsername, loadingTelegram]);

  const handleBack = () => {
    setView('selection');
  };

  const renderSelectionView = () => (
    <div className="space-y-4">
      <p className="text-center text-sm text-gray-600">{t('chooseProvider')}</p>

      <Button
        onClick={() => setView('whatsapp')}
        className="w-full h-12 bg-[#25D366] text-white hover:bg-[#1ebe5d] text-base font-medium"
      >
        <WhatsAppIcon className="h-6 w-6 mr-3" />
        {t('continueWithWhatsApp')}
      </Button>

      <Button
        onClick={() => setView('telegram')}
        disabled={loadingTelegram || !!telegramError}
        className="w-full h-12 bg-[#0088cc] text-white hover:bg-[#007ab8] disabled:bg-[#8ccae8] text-base font-medium"
      >
        <TelegramIcon className="h-6 w-6 mr-3" />
        {t('continueWithTelegram')}
      </Button>

      {telegramError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
          <p className="text-sm text-red-700">{telegramError}</p>
        </div>
      )}
    </div>
  );

  const renderTelegramView = () => (
    <div className="space-y-6">
      <button
        onClick={handleBack}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors -ml-1"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t('back')}
      </button>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="text-base font-semibold text-blue-900 mb-2">{t('telegramReady')}</h3>
        <p className="text-sm text-blue-700 mb-6 leading-relaxed">{t('telegramInstructions')}</p>

        <div className="flex justify-center">
          {loadingTelegram ? (
            <p className="text-sm text-blue-600 animate-pulse">{t('loadingTelegram')}</p>
          ) : telegramBotUsername ? (
            <TelegramLoginWidget
              botUsername={telegramBotUsername}
              buttonSize="large"
              className="w-full flex justify-center"
            />
          ) : (
            <p className="text-sm text-red-600">{t('telegramError')}</p>
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          {t.rich('telegramManualSearch', {
            botUsername: telegramBotUsername || 'hair_salon_app_bot',
            bold: chunks => <strong>{chunks}</strong>,
          })}
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={open => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl text-center">{t('title')}</DialogTitle>
          <DialogDescription className="text-center mt-2">{t('description')}</DialogDescription>
        </DialogHeader>

        {view === 'selection' && renderSelectionView()}

        {view === 'whatsapp' && <WhatsAppOTPLogin onSuccess={onClose} onBack={handleBack} />}

        {view === 'telegram' && renderTelegramView()}

        <div className="mt-6 border-t border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-400 max-w-xs mx-auto text-balance">
            {t('termsAgreement')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

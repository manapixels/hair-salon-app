'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { LoadingButton } from '../feedback/loaders/LoadingButton';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

interface MagicLinkLoginProps {
  onSuccess: () => void;
  onBack: () => void;
}

export default function MagicLinkLogin({ onSuccess, onBack }: MagicLinkLoginProps) {
  const t = useTranslations('OAuthLoginModal');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);

  const checkUserExists = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) return;

    setCheckingUser(true);
    try {
      const response = await fetch('/api/auth/magic-link/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToCheck }),
      });

      const data = (await response.json()) as { exists: boolean; name?: string };

      if (data.exists) {
        setIsNewUser(false);
        if (data.name) setName(data.name);
      } else {
        setIsNewUser(true);
        setName('');
      }
    } catch (error) {
      console.error('Failed to check user:', error);
      setIsNewUser(false);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: isNewUser ? name : undefined }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send magic link');
      }

      setSent(true);
      toast.success(t('magicLinkSent'));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send magic link';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{t('checkYourEmail')}</h3>
        <p className="text-sm text-gray-600">
          {t.rich('magicLinkSentTo', {
            email,
            bold: chunks => <strong>{chunks}</strong>,
          })}
        </p>
        <p className="text-xs text-gray-500">{t('magicLinkExpiry')}</p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail('');
          }}
          className="text-primary hover:text-primary/80 text-sm font-medium"
        >
          {t('tryDifferentEmail')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors -ml-1"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t('back')}
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-full">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{t('continueWithEmail')}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('emailLabel')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              // Check user after they finish typing (on blur)
            }}
            onBlur={() => checkUserExists(email)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={loading}
            required
          />
        </div>

        {isNewUser && !checkingUser && email && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              {t('nameLabel')}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{t('newUserNote')}</p>
          </div>
        )}

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <LoadingButton
          type="submit"
          disabled={!email || (isNewUser && !name)}
          loading={loading}
          loadingText={t('sendingMagicLink')}
          className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {t('sendMagicLink')}
        </LoadingButton>
      </form>

      <p className="text-xs text-gray-500 text-center">{t('magicLinkInfo')}</p>
    </div>
  );
}

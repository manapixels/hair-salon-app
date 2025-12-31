'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

interface TelegramLoginWidgetProps {
  botUsername: string;
  buttonSize?: 'large' | 'medium' | 'small';
  className?: string;
}

const TelegramLoginWidget: React.FC<TelegramLoginWidgetProps> = ({
  botUsername,
  buttonSize = 'large',
  className = '',
}) => {
  const t = useTranslations('OAuthLoginModal');
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const popupWindowRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loginTokenRef = useRef<string | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    popupWindowRef.current = null;
    loginTokenRef.current = null;
    setLoading(false);
    setStatusMessage(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Claim the session in the original browser
  const claimSession = useCallback(
    async (token: string) => {
      console.log('[TelegramLoginWidget] Claiming session...');
      try {
        const response = await fetch('/api/auth/telegram/claim-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error('Failed to claim session');
        }

        const data = await response.json();
        console.log('[TelegramLoginWidget] Session claimed successfully:', data);

        // Trigger auth refresh so the app updates
        window.dispatchEvent(new Event('auth-refresh'));

        // Show success toast
        toast.success(t('loginSuccessful') || 'Login successful!', { icon: '🎉' });

        cleanup();

        // Redirect to home or refresh the page
        window.location.href = '/?login=success';
      } catch (err) {
        console.error('[TelegramLoginWidget] Failed to claim session:', err);
        setError(t('loginError') || 'Failed to complete login');
        cleanup();
      }
    },
    [cleanup, t],
  );

  // Poll for login status
  const pollLoginStatus = useCallback(async () => {
    const token = loginTokenRef.current;
    if (!token) return;

    try {
      const response = await fetch(`/api/auth/telegram/check-login-status?token=${token}`);
      const data = (await response.json()) as { status: string; hasUser?: boolean };

      console.log('[TelegramLoginWidget] Polling status:', data.status);

      if (data.status === 'completed') {
        // Login completed in Telegram's browser! Claim it in this browser.
        await claimSession(token);
      } else if (data.status === 'expired' || data.status === 'not_found') {
        // Token expired or invalid
        console.log('[TelegramLoginWidget] Token expired or not found');
        setError(t('loginTimedOut') || 'Login timed out. Please try again.');
        cleanup();
      }
      // If status is 'pending', keep polling
    } catch (err) {
      console.error('[TelegramLoginWidget] Polling error:', err);
      // Don't cleanup on network errors, just keep trying
    }
  }, [claimSession, cleanup, t]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setStatusMessage(
      t('waitingForTelegramLogin') || 'Waiting for you to complete login in Telegram...',
    );

    try {
      // Generate login token with locale
      const response = await fetch('/api/auth/telegram/start-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate login token');
      }

      const { token, locale: returnedLocale } = (await response.json()) as {
        token: string;
        locale?: string;
      };
      loginTokenRef.current = token;

      // Create deep link to Telegram bot - include locale in the start parameter
      const startParam = returnedLocale ? `login_${returnedLocale}_${token}` : `login_${token}`;
      const telegramDeepLink = `https://t.me/${botUsername}?start=${startParam}`;

      // Detect iOS for better app opening behavior
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS) {
        // iOS: try native tg:// scheme first for reliable app opening
        // Universal Links (t.me) can be inconsistent on iOS
        const tgNativeLink = `tg://resolve?domain=${botUsername}&start=${startParam}`;
        window.location.href = tgNativeLink;

        // Fallback to t.me if app not installed (after short delay)
        setTimeout(() => {
          // Only open if we're still on the page (app didn't open)
          if (document.hasFocus()) {
            popupWindowRef.current = window.open(telegramDeepLink, '_blank');
          }
        }, 1500);
      } else {
        // Non-iOS: use Universal Link
        popupWindowRef.current = window.open(telegramDeepLink, '_blank');
      }

      // Start polling for login completion
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Poll every 2 seconds
      pollingIntervalRef.current = setInterval(pollLoginStatus, 2000);

      // Also poll immediately in case it's already complete
      setTimeout(pollLoginStatus, 100);

      // Auto-stop polling after 5 minutes (timeout)
      setTimeout(
        () => {
          if (pollingIntervalRef.current) {
            console.log('[TelegramLoginWidget] Polling timeout reached');
            setError(t('loginTimedOut') || 'Login timed out. Please try again.');
            cleanup();
          }
        },
        5 * 60 * 1000,
      );
    } catch (err) {
      console.error('Login error:', err);
      setError(t('loginError') || 'Failed to start login');
      setLoading(false);
    }
  };

  // Button size classes
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        onClick={handleLogin}
        disabled={loading}
        className={`
          inline-flex items-center justify-center gap-2
          bg-[#0088cc] hover:bg-[#0077b5]
          text-white font-medium rounded-lg
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[buttonSize]}
        `}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
        </svg>
        {loading ? t('loadingTelegram').replace('...', '') : t('loginWithTelegram')}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {loading && statusMessage && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">{statusMessage}</p>
      )}
    </div>
  );
};

export default TelegramLoginWidget;

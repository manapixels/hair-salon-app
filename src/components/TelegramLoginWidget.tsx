'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupWindowRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Generate login token
      const response = await fetch('/api/auth/telegram/start-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate login token');
      }

      const { token } = await response.json();

      // Create deep link to Telegram bot
      const telegramDeepLink = `https://t.me/${botUsername}?start=login_${token}`;

      // Open Telegram in new window/tab
      popupWindowRef.current = window.open(telegramDeepLink, '_blank');

      // Start polling to check if popup was closed
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(() => {
        if (popupWindowRef.current && popupWindowRef.current.closed) {
          // User closed the popup without completing login
          clearInterval(pollingIntervalRef.current!);
          pollingIntervalRef.current = null;
          setLoading(false);
          toast.error('Login cancelled. Please try again if you want to log in.');
          popupWindowRef.current = null;
        }
      }, 500);

      // Auto-stop polling after 5 minutes (timeout)
      setTimeout(
        () => {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            setLoading(false);
            if (popupWindowRef.current && !popupWindowRef.current.closed) {
              toast('Login timed out. Please try again.', { icon: '⏱️' });
            }
            popupWindowRef.current = null;
          }
        },
        5 * 60 * 1000,
      );

      // Show success message
      setError(null);
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to initiate login. Please try again.');
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
    <div className={className}>
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
        {loading ? 'Opening Telegram...' : 'Login with Telegram'}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {loading && (
        <p className="mt-2 text-sm text-gray-600">
          📱 Opening Telegram... Click &quot;Start&quot; in the bot chat to complete login.
        </p>
      )}
    </div>
  );
};

export default TelegramLoginWidget;

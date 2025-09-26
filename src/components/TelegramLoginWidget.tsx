'use client';

import { useEffect, useRef } from 'react';

interface TelegramLoginWidgetProps {
  botUsername: string;
  onAuth?: (user: any) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write';
  usePic?: boolean;
  className?: string;
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth: (user: any) => void;
    };
  }
}

const TelegramLoginWidget: React.FC<TelegramLoginWidgetProps> = ({
  botUsername,
  onAuth,
  buttonSize = 'large',
  cornerRadius,
  requestAccess,
  usePic = true,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!botUsername || !ref.current) return;

    // Create callback function
    const callbackName = `telegramCallback_${Date.now()}`;
    (window as any)[callbackName] = (user: any) => {
      // Send to our backend for verification
      const params = new URLSearchParams({
        id: user.id.toString(),
        first_name: user.first_name,
        last_name: user.last_name || '',
        username: user.username || '',
        photo_url: user.photo_url || '',
        auth_date: user.auth_date.toString(),
        hash: user.hash,
      });

      // Redirect to callback endpoint
      window.location.href = `/api/auth/telegram/callback?${params.toString()}`;
    };

    // Clear existing content
    ref.current.innerHTML = '';

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-onauth', callbackName);

    if (cornerRadius !== undefined) {
      script.setAttribute('data-radius', cornerRadius.toString());
    }

    if (requestAccess) {
      script.setAttribute('data-request-access', requestAccess);
    }

    if (!usePic) {
      script.setAttribute('data-userpic', 'false');
    }

    // Append script to container
    ref.current.appendChild(script);

    // Cleanup
    return () => {
      if ((window as any)[callbackName]) {
        delete (window as any)[callbackName];
      }
    };
  }, [botUsername, buttonSize, cornerRadius, requestAccess, usePic]);

  return <div ref={ref} className={className} />;
};

export default TelegramLoginWidget;

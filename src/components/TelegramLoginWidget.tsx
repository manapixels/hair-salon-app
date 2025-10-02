'use client';

import { useEffect, useRef } from 'react';

interface TelegramLoginWidgetProps {
  botUsername: string;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write';
  usePic?: boolean;
  className?: string;
}

const TelegramLoginWidget: React.FC<TelegramLoginWidgetProps> = ({
  botUsername,
  buttonSize = 'large',
  cornerRadius,
  requestAccess,
  usePic = true,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!botUsername || !ref.current) return;

    // Clear existing content
    ref.current.innerHTML = '';

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', buttonSize);

    // Use redirect mode instead of callback mode
    // This constructs the full callback URL for Telegram to redirect to
    const callbackUrl = `${window.location.origin}/api/auth/telegram/callback`;
    script.setAttribute('data-auth-url', callbackUrl);

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
  }, [botUsername, buttonSize, cornerRadius, requestAccess, usePic]);

  return <div ref={ref} className={className} />;
};

export default TelegramLoginWidget;

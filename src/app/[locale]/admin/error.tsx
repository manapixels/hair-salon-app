'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  const t = useTranslations('Error');

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Admin page error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-foreground mb-2">{t('adminTitle')}</h1>
        <p className="text-muted-foreground mb-4">{t('adminDescription')}</p>

        {/* Technical details for admins */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm font-medium text-foreground mb-1">Technical Details</p>
          <p className="text-xs text-muted-foreground font-mono break-all">
            {error.message || 'Unknown error'}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 mt-2 font-mono">
              Digest: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('tryAgain')}
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4" />
              {t('backToAdmin')}
            </Link>
          </Button>
          <Button asChild variant="ghost" className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              {t('goHome')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

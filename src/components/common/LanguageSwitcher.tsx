'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const activeLocale = useLocale();

  const onSelectChange = (nextLocale: string) => {
    // Persist language preference
    localStorage.setItem('user-locale', nextLocale);
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

    startTransition(() => {
      // Replace the locale in the pathname
      const segments = pathname.split('/');
      segments[1] = nextLocale;
      const newPath = segments.join('/');
      router.replace(newPath);
    });
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => onSelectChange('en')}
        disabled={isPending}
        className={`font-medium transition-colors ${
          activeLocale === 'en' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        EN
      </button>
      <span className="text-gray-300">/</span>
      <button
        onClick={() => onSelectChange('zh')}
        disabled={isPending}
        className={`font-medium transition-colors ${
          activeLocale === 'zh' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        中
      </button>
    </div>
  );
}

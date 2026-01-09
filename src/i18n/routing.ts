import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'zh'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Don't redirect to /en for default locale - saves a redirect
  localePrefix: 'as-needed',
});

// Export navigation utilities that automatically handle locale prefix
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

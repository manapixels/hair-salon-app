import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

// Static imports for Cloudflare Workers compatibility
// (dynamic imports with template literals cause fs.readdir at runtime)
import enMessages from './en.json';
import zhMessages from './zh.json';

const messages: Record<string, typeof enMessages> = {
  en: enMessages,
  zh: zhMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: messages[locale] || messages[routing.defaultLocale],
  };
});

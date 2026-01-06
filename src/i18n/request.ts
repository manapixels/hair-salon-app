import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

// Static imports for Cloudflare Workers compatibility
// (dynamic imports with template literals cause fs.readdir at runtime)
// Static imports for Cloudflare Workers compatibility
import enCommon from './en/common.json';
import enDashboard from './en/dashboard.json';
import enServices from './en/services.json';
import enLegal from './en/legal.json';

import zhCommon from './zh/common.json';
import zhDashboard from './zh/dashboard.json';
import zhServices from './zh/services.json';
import zhLegal from './zh/legal.json';

const messages: Record<string, any> = {
  en: { ...enCommon, ...enDashboard, Services: enServices, Legal: enLegal },
  zh: { ...zhCommon, ...zhDashboard, Services: zhServices, Legal: zhLegal },
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

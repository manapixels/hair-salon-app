import type { Metadata } from 'next';

// Static imports for metadata translations
import enMetadata from '@/i18n/en/metadata.json';
import zhMetadata from '@/i18n/zh/metadata.json';

const metadataMessages: Record<string, typeof enMetadata> = {
  en: enMetadata,
  zh: zhMetadata,
};

type MetadataPath = string[];

/**
 * Get nested value from metadata object using path array
 */
function getNestedValue(obj: any, path: string[]): any {
  return path.reduce((acc, key) => acc?.[key], obj);
}

/**
 * Generate page metadata with i18n support
 * @param locale - The current locale (en, zh)
 * @param titlePath - Path to the title in metadata.json, e.g., ['pages', 'home', 'title']
 * @param descPath - Optional path to description, e.g., ['pages', 'home', 'description']
 * @param addSuffix - Whether to add the brand suffix (default: true)
 * @param isAdmin - Whether this is an admin page (uses adminSuffix)
 */
export function generatePageMetadata(
  locale: string,
  titlePath: MetadataPath,
  descPath?: MetadataPath,
  addSuffix = true,
  isAdmin = false,
): Metadata {
  const messages = metadataMessages[locale] || metadataMessages.en;

  let title = getNestedValue(messages, titlePath) || 'Signature Trims';

  if (addSuffix) {
    const suffix = isAdmin ? messages.adminSuffix : messages.suffix;
    title = `${title}${suffix}`;
  }

  const description = descPath ? getNestedValue(messages, descPath) : undefined;

  return {
    title,
    ...(description && { description }),
  };
}

/**
 * Shorthand for public page metadata
 */
export function publicPageMetadata(locale: string, pageKey: string, nestedKey?: string): Metadata {
  const titlePath = nestedKey
    ? ['pages', pageKey, nestedKey, 'title']
    : ['pages', pageKey, 'title'];
  const descPath = nestedKey
    ? ['pages', pageKey, nestedKey, 'description']
    : ['pages', pageKey, 'description'];

  return generatePageMetadata(locale, titlePath, descPath, true, false);
}

/**
 * Shorthand for admin page metadata
 */
export function adminPageMetadata(locale: string, section: string, subSection?: string): Metadata {
  const titlePath = subSection
    ? ['admin', section, subSection, 'title']
    : ['admin', section, 'title'];
  const descPath = subSection
    ? ['admin', section, subSection, 'description']
    : ['admin', section, 'description'];

  return generatePageMetadata(locale, titlePath, descPath, true, true);
}

import { getTranslations } from 'next-intl/server';
import { getServiceCategories } from '@/lib/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookCategoryButton } from '@/components/prices/BookCategoryButton';
import { toServiceKey } from '@/lib/i18n/toServiceKey';

export default async function PricesPage() {
  const t = await getTranslations('Services.Pricing');
  const tItems = await getTranslations('Services.ServiceItems');
  const tDescriptions = await getTranslations('Services.ServiceDescriptions');
  const tCategoryDescriptions = await getTranslations('Services.CategoryDescriptions');
  const tNav = await getTranslations('Navigation');
  const categories = await getServiceCategories();

  // Helper to get translated service name with fallback
  const getServiceName = (name: string) => {
    const key = toServiceKey(name);
    try {
      const translated = tItems(key as any);
      // If translation key not found, next-intl returns the key - fall back to original
      return translated === key ? name : translated;
    } catch {
      return name;
    }
  };

  // Helper to get translated category name
  const getCategoryName = (slug: string, fallback: string) => {
    try {
      return tNav(`serviceNames.${slug}` as any) || fallback;
    } catch {
      return fallback;
    }
  };

  // Helper to get translated service description with fallback
  const getServiceDescription = (name: string, description: string | undefined) => {
    if (!description) return '—';
    const key = toServiceKey(name);
    try {
      const translated = tDescriptions(key as any);
      return translated === key ? description : translated;
    } catch {
      return description;
    }
  };

  // Helper to get translated category description with fallback
  const getCategoryDescription = (slug: string, description: string | undefined) => {
    if (!description) return null;
    try {
      const translated = tCategoryDescriptions(slug as any);
      return translated === slug ? description : translated;
    } catch {
      return description;
    }
  };

  // Helper to format price with translated "From" prefix
  const formatPrice = (price: string) => {
    if (price.startsWith('From ')) {
      const amount = price.replace('From ', '');
      return t('table.priceFrom', { amount });
    }
    return price;
  };

  // Sort categories by sortOrder
  const sortedCategories = categories
    .filter(cat => cat.items && cat.items.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-white py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-light text-gray-900 mb-4">
            {t('hero.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('hero.description')}</p>
        </div>
      </div>

      {/* Category Tables */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {sortedCategories.map((category, index) => (
          <section key={category.id} className={`${index !== 0 ? 'mt-20' : ''}`}>
            {/* Category Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-serif font-light text-gray-900 mb-2">
                  {getCategoryName(category.slug, category.title)}
                </h2>
                {category.description && (
                  <p className="text-gray-600 text-base">
                    {getCategoryDescription(category.slug, category.description)}
                  </p>
                )}
                {category.priceRangeMin && category.priceRangeMax && (
                  <p className="text-sm text-gray-500 mt-1">
                    {t('table.priceRange', {
                      min: category.priceRangeMin,
                      max: category.priceRangeMax,
                    })}
                  </p>
                )}
              </div>
              <BookCategoryButton
                categorySlug={category.slug}
                className="shrink-0"
                label={t('book', {
                  category: getCategoryName(category.slug, category.shortTitle || category.title),
                })}
              />
            </div>

            {/* Services Table */}
            <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 w-[30%]">
                      {t('table.service')}
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 w-[40%]">
                      {t('table.description')}
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right w-[15%]">
                      {t('table.price')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.items
                    .filter(service => service.isActive)
                    .map(service => (
                      <>
                        {/* Main Service Row */}
                        <TableRow key={service.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium text-gray-900">
                            {getServiceName(service.name)}
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm">
                            {getServiceDescription(service.name, service.description)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-900">
                            {formatPrice(service.price)}
                          </TableCell>
                        </TableRow>

                        {/* Add-on Rows */}
                        {service.addons &&
                          service.addons.length > 0 &&
                          service.addons.map(addon => (
                            <TableRow
                              key={addon.id}
                              className="bg-muted/30 hover:bg-muted/40 border-l-2 border-l-primary/30"
                            >
                              <TableCell className="pl-8 text-sm text-gray-700">
                                <span className="text-primary mr-1">+</span>
                                {getServiceName(addon.name)}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {getServiceDescription(addon.name, addon.description)}
                              </TableCell>
                              <TableCell className="text-right text-sm text-gray-700">
                                {formatPrice(addon.price)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </>
                    ))}
                </TableBody>
              </Table>
            </div>

            {/* Category Note if available */}
            {category.priceNote && (
              <p className="text-sm text-gray-500 italic mt-2 ml-2">
                *{formatPrice(category.priceNote)}
              </p>
            )}
          </section>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="bg-primary/5 py-12 px-4 mt-16">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-2xl font-serif font-light text-gray-900 mb-3">{t('cta.title')}</h3>
          <p className="text-gray-600 mb-6">{t('cta.description')}</p>
          <BookCategoryButton className="px-8" label={t('cta.button')} />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Services.Pricing' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

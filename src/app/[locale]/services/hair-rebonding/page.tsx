import React from 'react';
import { getTranslations } from 'next-intl/server';

import { Info } from '@/lib/icons';
import { notFound } from 'next/navigation';
import {
  ServiceHero,
  ServiceStats,
  ProcessStep,
  MaintenanceTip,
  ServiceTypeCard,
  ServiceFAQ,
  ServiceCTA,
} from '@/components/services';
import { getServiceContent } from '@/data/serviceContent';
import { getServiceCategories } from '@/lib/database';
import LineWithDiamondDivider from '@/components/services/LineWithDiamondDivider';

// --- Main Page ---

// --- Main Page ---

export default async function HairRebondingPage() {
  const t = await getTranslations('Services.HairRebonding');
  // Get static content for hair rebonding service
  const serviceContent = getServiceContent('hair-rebonding');

  if (!serviceContent) notFound();
  const servicePrice = 'From $70';

  // Fetch service ID from database
  const categories = await getServiceCategories();
  const hairRebondingService = categories
    .flatMap(cat => cat.items)
    .find(service => service.name.toLowerCase().includes('rebonding'));
  const serviceId = hairRebondingService?.id;

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <ServiceHero
        backgroundImage="/images/background-images/hair-rebonding.jpg"
        badge={{ text: t('hero.badge'), color: 'teal' }}
        headline={t('hero.headline')}
        subheading={t('hero.subheading')}
      />

      {/* Stats */}
      <ServiceStats
        stats={[
          { label: t('stats.maintenance.label'), value: t('stats.maintenance.value') },
          { label: t('stats.duration.label'), value: t('stats.duration.value') },
          { label: t('stats.price.label'), value: t('stats.price.value') },
        ]}
      />

      {/* Introduction */}
      <div className="container mx-auto px-6 md:px-12 text-center">
        <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto">{t('overview.intro')}</p>
      </div>

      {/* Rebonding Types */}
      <div className="container mx-auto px-6 md:px-12 py-16 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif font-light mb-4">{t('overview.title')}</h2>
          <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto">
            {t('overview.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(t.raw('types') as any[]).map((type, index) => (
            <ServiceTypeCard
              key={index}
              title={type.title}
              description={type.description}
              image={type.image}
            />
          ))}
        </div>
      </div>

      {/* Section Divider */}
      <LineWithDiamondDivider />

      {/* Process & Aftercare */}
      <div className="container mx-auto px-6 md:px-12 py-12 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-6">
          {/* Left: Process */}
          <div className="md:p-12">
            <h2 className="text-3xl font-serif font-light mb-8">{t('process.title')}</h2>
            <div className="space-y-8">
              {(t.raw('process.steps') as any[]).map((step, index) => (
                <ProcessStep
                  key={index}
                  number={step.number}
                  title={step.title}
                  description={step.description}
                  colorScheme="primary"
                />
              ))}
            </div>
          </div>

          {/* Right: Aftercare */}
          <div className="bg-stone-50 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-serif font-light mb-8">{t('aftercare.title')}</h2>
            <div className="space-y-8">
              {(t.raw('aftercare.tips') as any[]).map((tip, index) => (
                <MaintenanceTip key={index} title={tip.title} text={tip.text} />
              ))}
            </div>

            <div className="mt-8 p-4 border border-primary-600 bg-white rounded-xl flex gap-4 items-start">
              <p className="text-base">
                <strong>Note:</strong> {t('aftercare.note')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <ServiceFAQ
        title={t('faq.title')}
        description={t('faq.description')}
        questions={t.raw('faq.questions') as any[]}
      />

      {/* CTA Section */}
      <ServiceCTA
        title={t('cta.title')}
        description={t('cta.description')}
        serviceName="Hair Rebonding"
        serviceId={serviceId}
      />
    </div>
  );
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Services.HairRebonding' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

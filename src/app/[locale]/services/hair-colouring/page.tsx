import React from 'react';
import { getTranslations } from 'next-intl/server';

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

// --- Main Page ---

// --- Main Page ---

export default async function HairColouringPage() {
  const t = await getTranslations('Services.HairColouring');
  // Get static content for hair colouring service
  const serviceContent = getServiceContent('hair-colouring');

  if (!serviceContent) notFound();
  const servicePrice = 'From $70';

  // Fetch service ID from database - find first service with "Colouring" in the name
  const categories = await getServiceCategories();
  const hairColouringService = categories
    .flatMap(cat => cat.items)
    .find(service => service.name.toLowerCase().includes('colouring'));
  const serviceId = hairColouringService?.id;

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <ServiceHero
        backgroundImage="/background-images/hair-colouring.jpg"
        badge={{ text: t('hero.badge'), color: 'mint' }}
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

      {/* Services */}
      <div className="container mx-auto px-6 md:px-12 py-16 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif font-light mb-4">{t('overview.title')}</h2>
          <p className="text-base">{t('overview.subtitle')}</p>
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

      {/* Process & Aftercare */}
      <div className="container mx-auto px-4 px-6 md:px-12 py-16 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Left: Process */}
          <div className="p-8 md:p-12">
            <h2 className="text-3xl font-serif font-light mb-8">{t('process.title')}</h2>
            <div className="space-y-8">
              {(t.raw('process.steps') as any[]).map((step, index) => (
                <ProcessStep
                  key={index}
                  number={step.number}
                  title={step.title}
                  description={step.description}
                />
              ))}
            </div>
          </div>

          {/* Right: Aftercare */}
          <div className="bg-stone-50 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-serif font-light mb-8">{t('aftercare.title')}</h2>
            <div className="space-y-4">
              {(t.raw('aftercare.tips') as any[]).map((tip, index) => (
                <MaintenanceTip key={index} title={tip.title} text={tip.text} />
              ))}
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
        serviceName="Hair Colouring"
        serviceId={serviceId}
      />
    </div>
  );
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Services.HairColouring' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

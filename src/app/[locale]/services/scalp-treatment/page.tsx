import React from 'react';
import { getTranslations } from 'next-intl/server';

import { CheckCircle, Plus } from '@/lib/icons';
import {
  ServiceHero,
  ServiceStats,
  ProcessStep,
  MaintenanceTip,
  ServiceFAQ,
  ServiceCTA,
  LineWithDiamondDivider,
} from '../_components';
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider';

// --- Local Components ---

const TreatmentCard = ({
  title,
  description,
  benefits,
  benefitsLabel,
}: {
  title: string;
  description: string;
  benefits: string[];
  benefitsLabel: string;
}) => (
  <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
    <div className="flex justify-between items-start mb-4">
      <h2 className="text-3xl font-serif font-light">{title}</h2>
    </div>
    <p className="text-base">{description}</p>
    <div className="pt-4 border-t border-stone-50">
      <p className="text-base">{benefitsLabel}</p>
      <ul className="space-y-2">
        {benefits.map((b, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-stone-500">
            <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
            {b}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const ProblemSolution = ({ problem, solution }: { problem: string; solution: string }) => (
  <div className="flex gap-4 items-start">
    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-1">
      <Plus className="w-5 h-5 rotate-45" />
    </div>
    <div>
      <p className="text-base">{problem}</p>
      <p className="text-base">{solution}</p>
    </div>
  </div>
);

// --- Services: Scalp Treatment Page ---

export default async function ScalpTreatmentPage() {
  const t = await getTranslations('Services.ScalpTreatment');

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <ServiceHero
        backgroundImage="/images/background-images/scalp-treatment.png"
        badge={{ text: t('hero.badge'), color: 'blue' }}
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

      {/* About Scalp Care Section */}
      <div className="container mx-auto px-6 md:px-12 py-16 bg-stone-50">
        <div className="container mx-auto px-6 md:px-12 py-16 bg-white md:rounded-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Why Hair Scalp Treatment? */}
            <div>
              <h2 className="text-3xl font-serif font-light mb-6">{t('why.title')}</h2>
              <p className="text-base">{t('why.subtitle')}</p>
              <div className="space-y-6">
                {(t.raw('why.items') as any[]).map((why, index) => (
                  <ProblemSolution key={index} problem={why.title} solution={why.solution} />
                ))}
              </div>
            </div>
            {/* Right: Image  */}
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-lg">
              <BeforeAfterSlider
                beforeImage="/images/before-after/scalp-before.png"
                afterImage="/images/before-after/scalp-after.png"
                beforeLabel={t('why.beforeLabel')}
                afterLabel={t('why.afterLabel')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Available Treatments */}
      <div className="container mx-auto px-6 md:px-12 py-16 bg-white">
        <h2 className="text-3xl font-serif font-light mb-10">{t('treatments.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(t.raw('treatments.items') as any[]).map((treatment, index) => (
            <TreatmentCard
              key={index}
              title={treatment.title}
              description={treatment.description}
              benefits={treatment.benefits}
              benefitsLabel={t('treatments.benefitsLabel')}
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
                  colorScheme="teal"
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
        serviceName="Scalp Treatment"
        serviceSlug={'scalp-treatment'}
      />
    </div>
  );
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Services.ScalpTreatment' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

'use client';

import { useTranslations } from 'next-intl';
import { useBookingModal } from '@/context/BookingModalContext';

interface ServiceCTAProps {
  title: string;
  description: string;
  serviceName: string;
  serviceSlug?: string;
}

export function ServiceCTA({ title, description, serviceName, serviceSlug }: ServiceCTAProps) {
  const { openModal } = useBookingModal();
  const t = useTranslations('Services.Shared');
  const tNav = useTranslations('Navigation');

  // Use translated service name if slug is available, otherwise fallback to provided name
  const translatedServiceName = serviceSlug
    ? tNav(`serviceNames.${serviceSlug}`, { default: serviceName })
    : serviceName;

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-stone-900 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">{title}</h2>
        <p className="text-base md:text-xl mb-6 md:mb-8 text-stone-300">{description}</p>
        <button
          onClick={() => openModal({ preSelectedCategorySlug: serviceSlug })}
          className="min-h-touch-lg bg-white text-stone-900 px-10 py-4 rounded-full hover:bg-stone-100 active-scale transition-all duration-300 text-base md:text-lg font-semibold"
        >
          {t('bookCta', { serviceName: translatedServiceName })}
        </button>
      </div>
    </section>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Star, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TeamCard } from '@/components/team';
import LocationCard from '@/components/locations/LocationCard';
import { Sparkles } from '@/lib/icons';
import type { ServiceLink } from '@/lib/categories';
import { useBookingModal } from '@/context/BookingModalContext';
import { FindByConcernModal } from '@/components/services/FindByConcernModal';
import { useState, useEffect } from 'react';
import type { ServiceCategory, AdminSettings } from '@/types';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('HomePage');
  const tNav = useTranslations('Navigation');
  const { openModal, bookingCategories } = useBookingModal();
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [isConcernModalOpen, setIsConcernModalOpen] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json() as Promise<AdminSettings>)
      .then(settings => {
        setAdminSettings(settings);
      })
      .catch(err => console.error('Failed to fetch data:', err));
  }, []);

  // Compute service links for FindByConcernModal
  const serviceLinks: ServiceLink[] = bookingCategories
    .filter(c => c.isFeatured)
    .map(c => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      short_title: c.shortTitle || c.title,
      href: `/services/${c.slug}`,
      description: c.description || undefined,
      image: c.imageUrl || undefined,
      illustration: c.illustrationUrl || undefined,
    }));

  if (!adminSettings) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-[#FDFCF8] min-h-screen text-stone-900 font-serif">
      {/* Hero Section */}
      <section className="relative flex flex-col lg:flex-row lg:min-h-screen overflow-hidden">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 pt-8 pb-2 sm:py-12 md:p-8 lg:p-24 relative z-10 bg-primary/10">
          <div className="max-w-xl fade-in-up w-full">
            <div className="relative w-16 h-16 sm:w-28 sm:h-28 mb-6">
              <Image
                src="/images/logo.png"
                className="object-cover"
                fill
                alt="Signature Trims - Logo"
                sizes="112px"
              />
            </div>
            <span className="text-primary font-medium tracking-widest text-xs md:text-sm mb-3 md:mb-4 block">
              {t('est')}
            </span>
            <h1 className="font-serif text-2xl font-semibold sm:font-normal sm:text-4xl md:text-5xl lg:text-7xl text-primary leading-tight mb-0 sm:mb-6">
              {t.rich('heroTitle', {
                italic: chunks => <span className="italic text-primary/70">{chunks}</span>,
              })}
            </h1>
            <p className="hidden sm:block text-gray-500 text-base md:text-lg mb-6 md:mb-8 leading-relaxed max-w-md">
              {t('heroDescription')}
            </p>
            <div className="hidden sm:flex flex-col sm:flex-row gap-3 md:gap-4 mb-8 md:mb-12">
              <button
                onClick={() => openModal()}
                className="min-h-touch-lg bg-gray-900 text-white px-8 py-4 rounded-full hover:bg-primary active-scale transition-all duration-300 shadow-lg shadow-primary/20 text-sm font-medium uppercase tracking-wide"
              >
                {t('bookVisit')}
              </button>
              <a
                href="#services"
                className="min-h-touch-lg px-8 py-4 rounded-full border border-primary text-primary hover:bg-primary hover:text-white active-scale transition-all duration-300 text-sm font-medium uppercase tracking-wide flex items-center justify-center"
              >
                {t('viewMenu')}
              </a>
            </div>
            <div className="flex flex-row items-start sm:items-center gap-4 sm:gap-8 text-primary/80 sm:text-gray-400 text-sm">
              <a
                href="https://maps.app.goo.gl/umK5KbT3rN1HeEg5A"
                target="_blank"
                className="flex items-center gap-2 min-h-touch active-scale"
              >
                <Instagram className="w-4 h-4 flex-shrink-0" />
                <span>@signaturetrims</span>
              </a>
              <a
                href="https://maps.app.goo.gl/umK5KbT3rN1HeEg5A"
                target="_blank"
                className="flex items-center gap-2 min-h-touch active-scale"
              >
                <Star className="w-5 h-5 fill-[hsl(var(--primary))] text-transparent flex-shrink-0" />
                <span>5.0 (100+ Reviews)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="absolute top-0 left-0 sm:relative w-full lg:w-1/2 h-full sm:h-[40vh] md:h-[50vh] lg:h-auto">
          <Image
            src="/images/may-with-customer.jpg"
            alt="May with her customer"
            fill
            className="opacity-70 sm:opacity-100 absolute inset-0 w-full h-full object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <LocationCard address={adminSettings.businessAddress} />
          <div className="sm:hidden absolute inset-0 bg-gradient-to-b from-transparent via-[#FFFFFFB5] to-[#FFFFFF]"></div>
        </div>
      </section>

      {/* Featured Services Showcase */}
      {/* Mobile Ver. */}
      <section className="sm:hidden grid grid-cols-3 gap-4 md:gap-8 bg-white p-4">
        {/* Find by Concern Button */}
        <button
          onClick={() => setIsConcernModalOpen(true)}
          className="group/item flex flex-col items-center justify-between gap-1 border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors rounded-lg p-2"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-lg">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <span className="text-md text-center leading-[1.1] text-primary font-medium">
            {t('findByConcern')}
          </span>
        </button>

        {bookingCategories
          .filter(c => c.isFeatured)
          .map(category => {
            const serviceUrl = `/services/${category.slug}`;
            return (
              <DropdownMenu key={category.slug}>
                <DropdownMenuTrigger asChild>
                  <button className="group/item flex flex-col items-center justify-between gap-1 border border-primary/50 hover:border-primary transition-colors rounded-lg p-2 w-full outline-none focus:ring-2 focus:ring-primary/20 bg-transparent cursor-pointer">
                    <div className="relative w-16 h-16 rounded-lg">
                      <Image
                        src={category.illustrationUrl || ''}
                        alt={category.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <span className="text-md text-center leading-[1.1] text-primary font-medium flex-1 flex items-center justify-center w-full">
                      {tNav(`serviceNames.${category.slug}`)}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link
                      href={serviceUrl}
                      className="justify-center bg-transparent text-primary focus:bg-transparent"
                    >
                      {t('learnMore')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      openModal({
                        preSelectedCategoryId: category.id,
                      })
                    }
                    className="bg-primary text-white hover:text-white focus:text-white justify-center"
                  >
                    {t('bookNow')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
      </section>
      {/* Desktop Ver. */}
      <section className="hidden sm:block py-16 md:py-24 lg:px-12 bg-white" id="services">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-50 text-gold-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="uppercase tracking-wider">{t('signatureSelections')}</span>
          </div>
          <h2 className="text-4xl font-serif font-light mb-4">{t('premiumServicesTitle')}</h2>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-6">
            {t('premiumServicesDescription')}
          </p>

          {/* Find by Concern Button */}
          <button
            onClick={() => setIsConcernModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            <Search className="w-4 h-4" />
            {t('findByHairConcern')}
          </button>
        </div>

        {/* Featured Services Grid - Large Cards with Images */}
        <div className="px-4 md:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {bookingCategories
              .filter(c => c.isFeatured)
              .slice(0, 6)
              .map((category, index) => {
                const imageUrl =
                  category.imageUrl || '/images/background-images/menu-service-bg.png';
                const serviceUrl = `/services/${category.slug}`;
                const categoryId = category.id;

                // Format price display
                let priceDisplay = '';
                if (category.priceNote) {
                  priceDisplay = category.priceNote;
                } else if (category.priceRangeMin) {
                  priceDisplay = `From $${category.priceRangeMin}`;
                }

                return (
                  <div
                    key={category.id}
                    className="relative flex flex-col sm:flex-row gap-3 sm:gap-4 snap-center bg-[#FDFCF8] px-6 py-5 md:px-8 md:py-6 border border-white/5 hover:border-gold-primary/50 transition-colors duration-500 group rounded-lg"
                  >
                    <div className="w-full sm:w-[70%]">
                      <div className="text-gold-primary text-3xl md:text-4xl mb-4 md:mb-6 group-hover:translate-x-2 transition-transform duration-300">
                        0{index + 1}.
                      </div>
                      <h3 className="font-serif text-xl md:text-2xl text-primary mb-2">
                        {category.title}
                      </h3>
                      <div className="h-px w-full bg-primary/10 my-3 md:my-4"></div>
                      <div className="text-sm text-gray-400 uppercase tracking-wider mb-3 md:mb-4">
                        <span></span>
                        <span className="text-gold-light">{priceDisplay}</span>
                      </div>
                      {category.description && (
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                      {/* Service Details */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Link
                          href={serviceUrl}
                          className="min-h-touch-lg flex-1 py-3 bg-white text-primary/60 border-2 border-primary/60 rounded-lg hover:bg-stone-50 active-scale transition-colors duration-200 font-medium text-center"
                        >
                          {t('learnMore')}
                        </Link>
                        <button
                          onClick={() => openModal({ preSelectedCategoryId: categoryId })}
                          className="min-h-touch-lg py-3 bg-gray-800 text-white rounded-lg hover:bg-stone-800 active-scale transition-colors duration-200 font-medium text-center flex-1"
                        >
                          {t('bookNow')}
                        </button>
                      </div>
                    </div>
                    <div className="relative w-full h-48 sm:w-[30%] sm:h-auto sm:min-h-[200px] rounded-lg overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={category.title}
                        fill
                        className="object-cover transition-transform duration-700"
                        sizes="(max-width: 640px) 100vw, 30vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    </div>
                  </div>
                );
              })}
            <div className="group p-6 md:p-8 rounded-3xl bg-primary/30 text-black border border-transparent hover:scale-[1.02] active-scale transition-all duration-300 flex flex-col justify-center items-center text-center min-h-touch-lg">
              <h3 className="text-xl md:text-2xl font-serif mb-2">{t('needAdvice')}</h3>
              <p className="text-sm mb-6">{t('consultationDescription')}</p>
              <button
                onClick={() => openModal()}
                className="min-h-touch-lg bg-white text-primary px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary hover:text-white active-scale transition-colors"
              >
                {t('bookConsult')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* The Team */}
      <TeamCard />

      {/* Find by Concern Modal */}
      <FindByConcernModal
        isOpen={isConcernModalOpen}
        onClose={() => setIsConcernModalOpen(false)}
        serviceLinks={serviceLinks}
      />
    </div>
  );
}

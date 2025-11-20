import React from 'react';
import { prisma } from '@/lib/prisma';
import { Heading, Text, Container } from '@radix-ui/themes';
import Image from 'next/image';
import { Clock, Tag } from '@/lib/icons';
import { notFound } from 'next/navigation';
import ServiceDetailSections from '@/components/ServiceDetailSections';
import ServiceBookingWrapper from '@/components/ServiceBookingWrapper';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import { getServiceContent } from '@/data/serviceContent';

// This is a static server component for Hair Rebonding
export default async function HairRebondingPage() {
  // Fetch the specific service from the database
  const service = await prisma.service.findFirst({
    where: {
      name: 'Hair Rebonding',
    },
    include: {
      addons: true,
      category: true,
    },
  });

  if (!service) {
    notFound();
  }

  // Get rich content for this service
  const serviceContent = getServiceContent('hair-rebonding');

  return (
    <>
      <AppHeader />
      <div className="bg-[#FDFCF8] min-h-screen">
        {/* Hero Section */}
        <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
          <Image
            src={service.imageUrl || '/background-images/hair-rebonding.png'}
            alt={service.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60 flex items-center justify-center">
            <Container size="4" className="text-center text-white px-4">
              <Text size="2" className="uppercase tracking-[0.2em] font-sans mb-4 block opacity-90">
                {service.category.title}
              </Text>
              <Heading size="9" className="font-serif font-light mb-6">
                {service.name}
              </Heading>
              {service.subtitle && (
                <p className="text-xl font-light opacity-90 max-w-2xl mx-auto leading-relaxed">
                  {service.subtitle}
                </p>
              )}
            </Container>
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="bg-white border-y border-stone-200 py-8 mb-16">
          <Container size="3" className="px-6 md:px-12">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-stone-500 mb-2">
                  <Clock className="w-5 h-5" />
                  <Text className="text-sm uppercase tracking-wide">Duration</Text>
                </div>
                <Text className="text-2xl font-serif font-medium text-stone-900">
                  {service.duration} mins
                </Text>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-stone-500 mb-2">
                  <Tag className="w-5 h-5" />
                  <Text className="text-sm uppercase tracking-wide">Price</Text>
                </div>
                <Text className="text-2xl font-serif font-medium text-stone-900">
                  {service.price}
                </Text>
              </div>
              {service.popularityScore >= 80 && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-stone-500 mb-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <Text className="text-sm uppercase tracking-wide">Status</Text>
                  </div>
                  <Text className="text-2xl font-serif font-medium text-gold-600">Popular</Text>
                </div>
              )}
            </div>
          </Container>
        </div>

        {/* Main Content */}
        <Container size="3" className="px-6 md:px-12 mb-20">
          {/* Service Description */}
          <div className="mb-16">
            <Heading size="6" className="font-serif mb-6 text-stone-900 text-center">
              About This Service
            </Heading>
            <p className="text-stone-600 leading-relaxed text-lg max-w-4xl mx-auto text-center">
              {service.description ||
                'Experience our signature service designed to enhance your natural beauty. Our expert stylists use premium products and techniques to ensure the best results for your hair type.'}
            </p>
          </div>

          {/* Rich Content Sections (if available) */}
          {serviceContent && <ServiceDetailSections content={serviceContent} />}

          {/* Add-ons Section */}
          {service.addons && service.addons.length > 0 && (
            <div className="mt-20">
              <div className="text-center mb-12">
                <Text className="uppercase tracking-[0.2em] text-xs font-sans text-stone-500 mb-3 block">
                  Enhance Your Experience
                </Text>
                <Heading size="8" className="font-serif font-light text-stone-900">
                  Available Add-Ons
                </Heading>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {service.addons.map(addon => (
                  <div
                    key={addon.id}
                    className="bg-white rounded-xl border border-stone-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <Heading size="4" className="font-serif text-stone-900 flex-1">
                        {addon.name}
                      </Heading>
                      <Text className="font-bold text-stone-900 text-lg shrink-0 ml-4">
                        {addon.price}
                      </Text>
                    </div>
                    {addon.description && (
                      <p className="text-sm text-stone-600 mb-3">{addon.description}</p>
                    )}
                    {addon.benefits && addon.benefits.length > 0 && (
                      <ul className="space-y-1">
                        {addon.benefits.map((benefit, i) => (
                          <li key={i} className="text-xs text-stone-500 flex items-center gap-2">
                            <svg
                              className="w-3 h-3 text-gold-600 shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    )}
                    {addon.isRecommended && (
                      <div className="mt-3 pt-3 border-t border-stone-100">
                        <span className="text-xs font-medium text-gold-600 uppercase tracking-wide">
                          ⭐ Recommended
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Container>

        {/* Inline Booking Section */}
        <ServiceBookingWrapper preSelectedServiceId={service.id} serviceName={service.name} />
      </div>
      <AppFooter />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: 'Hair Rebonding | Signature Trims',
    description:
      'Achieve sleek, pin-straight hair that lasts 6-8 months with our professional Japanese rebonding service. Eliminate frizz completely and enjoy smooth, glossy hair with minimal daily styling.',
  };
}

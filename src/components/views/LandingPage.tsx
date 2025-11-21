'use client';

import { useState, useEffect } from 'react';
import { Heading, Text, Container, Section } from '@radix-ui/themes';
import Image from 'next/image';
import Link from 'next/link';
import BookingForm from '../booking/BookingForm';
import LocationCard from '../locations/LocationCard';
import TeamCard from '../team/TeamCard';
import { useBooking } from '@/context/BookingContext';
import { Sparkles } from '@/lib/icons';
import type { ServiceCategory } from '@/types';
import { Instagram, Star } from 'lucide-react';

// Featured service names
const FEATURED_SERVICE_NAMES = [
  'Hair Colouring',
  'Balayage',
  'Hair Rebonding',
  'Hair Treatment',
  'Hair Perm',
];

// Service names with static pages
const SERVICES_WITH_STATIC_PAGES: Record<string, string> = {
  'Hair Colouring': '/services/hair-colouring',
  Balayage: '/services/balayage',
  'Hair Rebonding': '/services/hair-rebonding',
  'Hair Treatment': '/services/hair-treatment',
  'Hair Perm': '/services/hair-perm',
};

// Get service page URL
function getServicePageUrl(serviceName: string): string | null {
  return SERVICES_WITH_STATIC_PAGES[serviceName] || null;
}

// Get service image
function getServiceImage(serviceName: string): string {
  const imageMap: Record<string, string> = {
    'Hair Colouring': '/background-images/hair-colouring.png',
    Balayage: '/background-images/balayage.png',
    'Hair Rebonding': '/background-images/hair-rebonding.png',
    'Hair Treatment': '/background-images/hair-treatment.png',
    'Hair Perm': '/background-images/hair-perm.png',
  };
  return imageMap[serviceName] || '/background-images/menu-service-bg.png';
}

export default function LandingPage() {
  const { adminSettings, isLoadingSettings } = useBooking();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Extract featured services from categories
  const featuredServices = categories
    .flatMap(cat => cat.items)
    .filter(service => FEATURED_SERVICE_NAMES.includes(service.name));

  return (
    <div className="bg-[#FDFCF8] min-h-screen text-stone-900 font-serif">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col lg:flex-row pt-20 lg:pt-0 overflow-hidden relative">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative z-10 bg-brand-light">
          <div className="max-w-xl fade-in-up w-full">
            <span className="text-brand-accent font-medium tracking-widest uppercase text-sm mb-4 block">
              Est. 2024
            </span>
            <h1 className="font-serif text-5xl lg:text-7xl text-brand-dark leading-tight mb-6">
              Where Style Meets <span className="italic text-brand-accent">Soul.</span>
            </h1>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed max-w-md">
              Experience hair artistry at Signature Trims, a neighbourhood hair salon where we bring
              out the best in you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button className="bg-gray-900 text-white px-8 py-4 rounded-full hover:bg-brand-accent transition-all duration-300 shadow-lg shadow-brand-dark/20 text-sm font-medium uppercase tracking-wide">
                Book Your Visit
              </button>
              <a
                href="#services"
                className="px-8 py-4 rounded-full border border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white transition-all duration-300 text-sm font-medium uppercase tracking-wide flex items-center justify-center"
              >
                View Menu
              </a>
            </div>
            <div className="flex items-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <i className="fa-brands fa-instagram text-xl"></i>
                <a
                  href="https://maps.app.goo.gl/umK5KbT3rN1HeEg5A"
                  target="_blank"
                  className="text-sm"
                >
                  <Instagram className="w-4 h-4 inline mr-2" />
                  @signaturetrims
                </a>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-star text-brand-accent text-xl"></i>
                <a
                  href="https://maps.app.goo.gl/umK5KbT3rN1HeEg5A"
                  target="_blank"
                  className="text-sm"
                >
                  <Star className="w-5 h-5 fill-[var(--accent-9)] text-transparent inline mr-2" />
                  5.0 (100+ Reviews)
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="w-full lg:w-1/2 h-[50vh] lg:h-auto relative">
          <Image
            src="/may-with-customer.jpg"
            alt="May with her customer"
            fill
            className="absolute inset-0 w-full h-full object-cover"
            priority
          />
          {/* Location Card - Only show when settings are loaded */}
          {!isLoadingSettings && <LocationCard address={adminSettings.businessAddress} />}
        </div>
      </section>

      {/* Featured Services Showcase */}
      {!loading && featuredServices.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <Container size="4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-50 text-gold-700 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="uppercase tracking-wider">Signature Selections</span>
              </div>
              <Heading size="8" className="font-serif font-light mb-4">
                Our Premium Services
              </Heading>
              <Text size="3" className="text-stone-600 max-w-2xl mx-auto">
                Experience our most sought-after treatments, expertly crafted to deliver exceptional
                results and lasting beauty.
              </Text>
            </div>

            {/* Featured Services Grid - Large Cards with Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredServices.slice(0, 6).map(service => (
                <div
                  key={service.id}
                  className="group relative overflow-hidden rounded-xl bg-stone-50 hover:shadow-2xl transition-all duration-500"
                >
                  {/* Service Image */}
                  <div className="relative h-72 overflow-hidden">
                    <Image
                      src={service.imageUrl || getServiceImage(service.name)}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                    {/* Price Badge */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full">
                      <span className="text-stone-900 font-semibold">{service.price}</span>
                    </div>

                    {/* Service Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <Heading size="6" className="font-serif text-white mb-1">
                        {service.name}
                      </Heading>
                      {service.subtitle && (
                        <Text size="2" className="text-white/80">
                          {service.subtitle}
                        </Text>
                      )}
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className="p-6">
                    <div className="flex gap-3">
                      {(() => {
                        const serviceUrl = getServicePageUrl(service.name);
                        return (
                          <>
                            {serviceUrl && (
                              <Link
                                href={serviceUrl}
                                className="flex-1 py-3 bg-white text-stone-900 border-2 border-stone-900 rounded-lg hover:bg-stone-50 transition-colors duration-200 font-medium text-center"
                              >
                                Learn More
                              </Link>
                            )}
                            <button
                              onClick={() => (window.location.href = '/?book=true')}
                              className={`py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors duration-200 font-medium ${serviceUrl ? 'flex-1' : 'w-full'}`}
                            >
                              Book Now
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Booking Section */}
      <Section size="3" className="bg-[#FDFCF8]" id="booking-section">
        <Container size="4">
          <div className="text-center mb-12">
            <Text
              size="2"
              className="uppercase tracking-[0.2em] text-gold-600 font-sans mb-4 block"
            >
              Reservations
            </Text>
            <Heading size="8" className="font-light mb-6">
              Book Your Experience
            </Heading>
            <p className="text-stone-600 leading-relaxed font-sans max-w-2xl mx-auto">
              Select your preferred services and stylist to begin your journey with us.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-100">
            <BookingForm />
          </div>
        </Container>
      </Section>

      {/* The Team */}
      <TeamCard />
    </div>
  );
}

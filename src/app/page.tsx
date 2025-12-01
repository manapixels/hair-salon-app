'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Star } from 'lucide-react';
import { Heading, Text, Container, Section } from '@radix-ui/themes';
import { TeamCard } from '@/components/team';
import LocationCard from '../components/locations/LocationCard';
import { Sparkles } from '@/lib/icons';
import { SERVICE_LINKS } from '@/config/navigation';
import { useBookingModal } from '@/context/BookingModalContext';
import { useState, useEffect } from 'react';
import type { ServiceCategory, AdminSettings } from '@/types';

export default function HomePage() {
  const { openModal } = useBookingModal();
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  // Fetch data on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/settings').then(res => res.json()),
      fetch('/api/services').then(res => res.json()),
    ])
      .then(([settings, servicesData]) => {
        setAdminSettings(settings);
        setCategories(servicesData);
      })
      .catch(err => console.error('Failed to fetch data:', err));
  }, []);

  // Extract featured services from categories
  const featuredServiceNames = SERVICE_LINKS.map(s => s.title);
  const featuredServices = categories
    .flatMap(cat => cat.items)
    .filter(service => featuredServiceNames.includes(service.name));

  if (!adminSettings) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-[#FDFCF8] min-h-screen text-stone-900 font-serif">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row lg:min-h-screen md:pt-20 overflow-hidden relative">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 py-12 md:p-8 lg:p-24 relative z-10 bg-base-primary/10">
          <div className="max-w-xl fade-in-up w-full">
            <div className="relative w-28 h-28 mb-6">
              <Image
                src="/images/logo.png"
                className="object-cover"
                fill
                alt="Signature Trims - Logo"
              />
            </div>
            <span className="text-base-primary font-medium tracking-widest text-xs md:text-sm mb-3 md:mb-4 block">
              Est. 2024 • Yishun, Singapore
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl text-base-dark leading-tight mb-4 md:mb-6">
              Craft your <span className="italic text-base-primary">Signature</span> look with us
            </h1>
            <p className="text-gray-500 text-base md:text-lg mb-6 md:mb-8 leading-relaxed max-w-md">
              Experience hair artistry at Signature Trims, a neighbourhood hair salon where we bring
              out the best in you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-8 md:mb-12">
              <button
                onClick={() => openModal()}
                className="min-h-touch-lg bg-gray-900 text-white px-8 py-4 rounded-full hover:bg-base-primary active-scale transition-all duration-300 shadow-lg shadow-base-dark/20 text-sm font-medium uppercase tracking-wide"
              >
                Book Your Visit
              </button>
              <a
                href="#services"
                className="min-h-touch-lg px-8 py-4 rounded-full border border-base-dark text-base-dark hover:bg-base-dark hover:text-white active-scale transition-all duration-300 text-sm font-medium uppercase tracking-wide flex items-center justify-center"
              >
                View Menu
              </a>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 text-gray-400 text-sm">
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
                <Star className="w-5 h-5 fill-[var(--accent-9)] text-transparent flex-shrink-0" />
                <span>5.0 (100+ Reviews)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="w-full lg:w-1/2 h-[40vh] md:h-[50vh] lg:h-auto relative">
          <Image
            src="/may-with-customer.jpg"
            alt="May with her customer"
            fill
            className="absolute inset-0 w-full h-full object-cover"
            priority
          />
          <LocationCard address={adminSettings.businessAddress} />
        </div>
      </section>

      {/* Featured Services Showcase */}
      <section className="py-16 md:py-24 lg:px-12 bg-white" id="services">
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
        <div className="px-4 md:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {featuredServices.slice(0, 6).map((service, index) => {
              const serviceLink = SERVICE_LINKS.find(s => s.title === service.name);
              const imageUrl =
                service.imageUrl || serviceLink?.image || '/background-images/menu-service-bg.png';
              const serviceUrl = serviceLink?.href;

              return (
                <div
                  key={service.id}
                  className="relative flex flex-col sm:flex-row gap-3 sm:gap-4 snap-center bg-[#FDFCF8] px-6 py-5 md:px-8 md:py-6 border border-white/5 hover:border-gold-primary/50 transition-colors duration-500 group rounded-lg"
                >
                  <div className="w-full sm:w-[70%]">
                    <div className="text-gold-primary text-3xl md:text-4xl mb-4 md:mb-6 group-hover:translate-x-2 transition-transform duration-300">
                      0{index + 1}.
                    </div>
                    <h3 className="font-serif text-xl md:text-2xl text-base-primary mb-2">
                      {service.name}
                    </h3>
                    <div className="h-px w-full bg-base-primary/10 my-3 md:my-4"></div>
                    <div className="text-sm text-gray-400 uppercase tracking-wider mb-3 md:mb-4">
                      <span></span>
                      <span className="text-gold-light">{service.price}</span>
                    </div>
                    {service.subtitle && (
                      <p className="text-gray-500 text-sm mb-4">{service.subtitle}</p>
                    )}
                    {/* Service Details */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      {(() => {
                        return (
                          <>
                            {serviceUrl && (
                              <Link
                                href={serviceUrl}
                                className="min-h-touch-lg flex-1 py-3 bg-white text-base-primary/60 border-2 border-base-primary/60 rounded-lg hover:bg-stone-50 active-scale transition-colors duration-200 font-medium text-center"
                              >
                                Learn More
                              </Link>
                            )}
                            <button
                              onClick={() => openModal({ preSelectedServiceId: service.id })}
                              className={`min-h-touch-lg py-3 bg-gray-800 text-white rounded-lg hover:bg-stone-800 active-scale transition-colors duration-200 font-medium text-center ${serviceUrl ? 'flex-1' : 'w-full'}`}
                            >
                              Book Now
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="relative w-full h-48 sm:w-[30%] sm:h-auto sm:min-h-[200px] rounded-lg overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={service.name}
                      fill
                      className="object-cover transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  </div>
                </div>
              );
            })}
            <div className="group p-6 md:p-8 rounded-3xl bg-base-primary/30 text-black border border-transparent hover:scale-[1.02] active-scale transition-all duration-300 flex flex-col justify-center items-center text-center min-h-touch-lg">
              <h3 className="text-xl md:text-2xl font-serif mb-2">Need Advice?</h3>
              <p className="text-sm mb-6">Book a free 15-min consultation with a master stylist.</p>
              <button
                onClick={() => openModal()}
                className="min-h-touch-lg bg-white text-base-primary px-6 py-3 rounded-lg text-sm font-medium hover:bg-base-primary hover:text-white active-scale transition-colors"
              >
                Book Consult
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* The Team */}
      <TeamCard />
    </div>
  );
}

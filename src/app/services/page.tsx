'use client';

import React, { useEffect, useState } from 'react';
import ServiceCard from '@/components/services/ServiceCard';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Heading, Text, Container, Section, Grid, Tabs } from '@radix-ui/themes';
import { Service, ServiceCategory } from '@/types';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Search, Sparkles } from '@/lib/icons';
import Image from 'next/image';
import Link from 'next/link';

// Featured service IDs (premium offerings)
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

// Get service page URL - returns static page URL if available, otherwise null
function getServicePageUrl(serviceName: string): string | null {
  return SERVICES_WITH_STATIC_PAGES[serviceName] || null;
}

export default function ServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
        setError(err instanceof Error ? err.message : 'An error occurred');
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

  // Filter services based on search and category
  const filteredCategories = categories
    .map(category => ({
      ...category,
      items: category.items.filter(service => {
        const matchesSearch =
          searchQuery === '' ||
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === 'all' || category.id === selectedCategory;

        return matchesSearch && matchesCategory;
      }),
    }))
    .filter(category => category.items.length > 0);

  if (loading) {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
          <LoadingSpinner message="Loading services..." />
        </div>
        <AppFooter />
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
          <ErrorState
            title="Unable to load services"
            message={error}
            onRetry={() => window.location.reload()}
          />
        </div>
        <AppFooter />
      </>
    );
  }

  return (
    <>
      <AppHeader />

      <div className="bg-[#FDFCF8] min-h-screen">
        {/* Hero Section with Search */}
        <section className="bg-stone-900 text-white py-16 md:py-24 px-4">
          <Container size="4">
            <div className="text-center max-w-3xl mx-auto">
              <Text
                size="2"
                className="uppercase tracking-[0.2em] text-gold-400 font-sans mb-4 block"
              >
                Signature Services
              </Text>
              <Heading size="9" className="font-serif font-light mb-6">
                Discover Your Perfect Look
              </Heading>
              <p className="text-stone-300 text-lg font-light leading-relaxed mb-10">
                From precision cuts to transformative color treatments, explore our comprehensive
                menu of services designed to enhance your natural beauty.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search services, treatments, or styles..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </Container>
        </section>

        {/* Featured Services Showcase */}
        {featuredServices.length > 0 && searchQuery === '' && selectedCategory === 'all' && (
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
                  Experience our most sought-after treatments, expertly crafted to deliver
                  exceptional results and lasting beauty.
                </Text>
              </div>

              {/* Featured Services Grid - Large Cards with Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredServices.slice(0, 6).map((service, index) => (
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
                      <p className="text-stone-600 text-sm leading-relaxed mb-4 line-clamp-2">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-stone-500 mb-4">
                        <span>{service.duration} mins</span>
                        {service.tags && service.tags.length > 0 && (
                          <span className="px-3 py-1 bg-stone-100 rounded-full text-xs">
                            {service.tags[0]}
                          </span>
                        )}
                      </div>

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

        {/* Browse All Services by Category */}
        <section className="py-16 md:py-24 px-4">
          <Container size="4">
            <div className="text-center mb-12">
              <Heading size="7" className="font-serif font-light mb-4">
                {searchQuery ? 'Search Results' : 'Browse All Services'}
              </Heading>
              {!searchQuery && (
                <Text size="3" className="text-stone-600">
                  Explore our complete menu organized by category
                </Text>
              )}
            </div>

            {/* Category Filter Tabs */}
            {!searchQuery && (
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                    selectedCategory === 'all'
                      ? 'bg-stone-900 text-white shadow-md'
                      : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:shadow-sm'
                  }`}
                >
                  All Services
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-stone-900 text-white shadow-md'
                        : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:shadow-sm'
                    }`}
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            )}

            {/* Services Grid by Category */}
            <div className="space-y-16">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                    <Search className="w-8 h-8 text-stone-400" />
                  </div>
                  <Heading size="5" className="font-serif mb-2 text-stone-700">
                    No services found
                  </Heading>
                  <Text className="text-stone-500">
                    Try adjusting your search or browse all categories
                  </Text>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-6 px-6 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                filteredCategories.map(category => (
                  <div key={category.id} id={category.id} className="scroll-mt-24">
                    {/* Category Header */}
                    <div className="mb-8 pb-4 border-b border-stone-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <Heading size="6" className="font-serif text-stone-900 mb-2">
                            {category.title}
                          </Heading>
                          {category.description && (
                            <Text size="3" className="text-stone-500">
                              {category.description}
                            </Text>
                          )}
                        </div>
                        {category.priceRangeMin && category.priceRangeMax && (
                          <div className="text-right">
                            <Text
                              size="2"
                              className="text-stone-400 uppercase tracking-wider block mb-1"
                            >
                              Price Range
                            </Text>
                            <Text size="3" className="text-stone-700 font-medium">
                              ${category.priceRangeMin} - ${category.priceRangeMax}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Services Grid - Compact Cards */}
                    <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="6">
                      {category.items.map(service => (
                        <ServiceCard key={service.id} service={service} />
                      ))}
                    </Grid>
                  </div>
                ))
              )}
            </div>
          </Container>
        </section>

        {/* Trust & Expertise Section */}
        {searchQuery === '' && selectedCategory === 'all' && (
          <section className="py-16 bg-stone-900 text-white">
            <Container size="4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold-400/10 flex items-center justify-center">
                    <span className="text-3xl font-serif text-gold-400">15+</span>
                  </div>
                  <Heading size="4" className="font-serif font-light mb-2">
                    Years of Excellence
                  </Heading>
                  <Text size="2" className="text-stone-400">
                    Trusted by thousands of satisfied clients
                  </Text>
                </div>

                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold-400/10 flex items-center justify-center">
                    <span className="text-3xl font-serif text-gold-400">30+</span>
                  </div>
                  <Heading size="4" className="font-serif font-light mb-2">
                    Premium Services
                  </Heading>
                  <Text size="2" className="text-stone-400">
                    Comprehensive treatments for every need
                  </Text>
                </div>

                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold-400/10 flex items-center justify-center">
                    <span className="text-3xl font-serif text-gold-400">5★</span>
                  </div>
                  <Heading size="4" className="font-serif font-light mb-2">
                    Customer Rated
                  </Heading>
                  <Text size="2" className="text-stone-400">
                    Consistently excellent service quality
                  </Text>
                </div>
              </div>
            </Container>
          </section>
        )}
      </div>

      <AppFooter />
    </>
  );
}

// Helper function to provide default images for featured services
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

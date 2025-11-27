'use client';

import React, { ReactNode } from 'react';

interface ServicePageLayoutProps {
  hero?: ReactNode;
  stats?: ReactNode;
  overview?: ReactNode;
  benefits?: ReactNode;
  process?: ReactNode;
  variations?: ReactNode;
  aftercare?: ReactNode;
  faq?: ReactNode;
  cta?: ReactNode;
  children?: ReactNode;
}

/**
 * ServicePageLayout - A flexible wrapper component for service pages
 *
 * Provides named slots for consistent structure while allowing custom content per service.
 * Uses a slot-based approach where each section can be customized.
 *
 * @example
 * <ServicePageLayout
 *   hero={<CustomHero />}
 *   stats={<QuickStats />}
 *   overview={<ServiceOverview />}
 *   benefits={<BenefitsGrid />}
 *   process={<ProcessSteps />}
 *   variations={<ServiceVariations />}
 *   aftercare={<AftercareSection />}
 *   faq={<FAQSection />}
 *   cta={<BookingCTA />}
 * />
 */
export default function ServicePageLayout({
  hero,
  stats,
  overview,
  benefits,
  process,
  variations,
  aftercare,
  faq,
  cta,
  children,
}: ServicePageLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section - Full width, no padding */}
      {hero && <section className="relative">{hero}</section>}

      {/* Stats Bar - Full width with subtle background */}
      {stats && (
        <section className="bg-white border-b border-stone-200 py-8">
          <div className="container mx-auto px-4">{stats}</div>
        </section>
      )}

      {/* Main Content Area - Sections with consistent spacing */}
      <div className="space-y-20 py-16">
        {/* Overview Section */}
        {overview && (
          <section className="bg-cream-50 py-16">
            <div className="container mx-auto px-4">{overview}</div>
          </section>
        )}

        {/* Benefits Section */}
        {benefits && <section className="container mx-auto px-4">{benefits}</section>}

        {/* Process Section */}
        {process && (
          <section className="bg-white py-16">
            <div className="container mx-auto px-4">{process}</div>
          </section>
        )}

        {/* Service Variations Section - Custom per service */}
        {variations && <section className="container mx-auto px-4">{variations}</section>}

        {/* Aftercare Section */}
        {aftercare && (
          <section className="bg-cream-50 py-16">
            <div className="container mx-auto px-4">{aftercare}</div>
          </section>
        )}

        {/* FAQ Section */}
        {faq && <section className="container mx-auto px-4">{faq}</section>}

        {/* Booking CTA Section */}
        {cta && (
          <section className="bg-stone-900 text-white py-16">
            <div className="container mx-auto px-4">{cta}</div>
          </section>
        )}
      </div>

      {/* Children - For any additional custom content */}
      {children}
    </div>
  );
}

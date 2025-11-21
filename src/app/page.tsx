import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Star } from 'lucide-react';
import { Heading, Text, Container, Section } from '@radix-ui/themes';
import { TeamCard } from '@/components/team';
import LocationCard from '../components/locations/LocationCard';
import BookingForm from '../components/booking/BookingForm';
import { Sparkles } from '@/lib/icons';
import { getAdminSettings, getServiceCategories } from '@/lib/database';

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

export default async function HomePage() {
  const adminSettings = await getAdminSettings();
  const categories = await getServiceCategories();

  // Extract featured services from categories
  const featuredServices = categories
    .flatMap(cat => cat.items)
    .filter(service => FEATURED_SERVICE_NAMES.includes(service.name));

  return (
    <div className="bg-[#FDFCF8] min-h-screen text-stone-900 font-serif">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col lg:flex-row pt-20 lg:pt-0 overflow-hidden relative">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative z-10 bg-base-primary/10">
          <div className="max-w-xl fade-in-up w-full">
            <span className="text-base-primary font-medium tracking-widest text-sm mb-4 block">
              Est. 2024 • Yishun, Singapore
            </span>
            <h1 className="font-serif text-5xl lg:text-7xl text-base-dark leading-tight mb-6">
              Craft your <span className="italic text-base-primary">Signature</span> look with us
            </h1>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed max-w-md">
              Experience hair artistry at Signature Trims, a neighbourhood hair salon where we bring
              out the best in you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button className="bg-gray-900 text-white px-8 py-4 rounded-full hover:bg-base-primary transition-all duration-300 shadow-lg shadow-base-dark/20 text-sm font-medium uppercase tracking-wide">
                Book Your Visit
              </button>
              <a
                href="#services"
                className="px-8 py-4 rounded-full border border-base-dark text-base-dark hover:bg-base-dark hover:text-white transition-all duration-300 text-sm font-medium uppercase tracking-wide flex items-center justify-center"
              >
                View Menu
              </a>
            </div>
            <div className="flex items-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <i className="fa-bases fa-instagram text-xl"></i>
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
                <i className="fa-solid fa-star text-base-primary text-xl"></i>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredServices.slice(0, 6).map((service, index) => (
            <div
              key={service.id}
              className="relative flex gap-3 snap-center bg-[#FDFCF8] px-8 py-6 border border-white/5 hover:border-gold-primary/50 transition-colors duration-500 group rounded-lg"
            >
              <div className="w-[70%]">
                <div className="text-gold-primary text-4xl mb-6 group-hover:translate-x-2 transition-transform duration-300">
                  0{index + 1}.
                </div>
                <h3 className="font-serif text-2xl text-base-primary mb-2">{service.name}</h3>
                <div className="h-px w-full bg-base-primary/10 my-4"></div>
                <div className="text-sm text-gray-400 uppercase tracking-wider mb-4">
                  <span></span>
                  <span className="text-gold-light">{service.price}</span>
                </div>
                {service.subtitle && (
                  <p className="text-gray-500 text-sm mb-4">{service.subtitle}</p>
                )}
                {/* Service Details */}
                <div className="flex flex-start gap-3">
                  {(() => {
                    const serviceUrl = getServicePageUrl(service.name);
                    return (
                      <>
                        {serviceUrl && (
                          <Link
                            href={serviceUrl}
                            className="flex-1 py-3 bg-white text-base-primary/60 border-2 border-base-primary/60 rounded-lg hover:bg-stone-50 transition-colors duration-200 font-medium text-center"
                          >
                            Learn More
                          </Link>
                        )}
                        <Link
                          href="/?book=true"
                          className={`py-3 bg-gray-800 text-white rounded-lg hover:bg-stone-800 transition-colors duration-200 font-medium text-center ${serviceUrl ? 'flex-1' : 'w-full'}`}
                        >
                          Book Now
                        </Link>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="relative w-[30%] h-[70%] rounded-lg overflow-hidden">
                <Image
                  src={service.imageUrl || getServiceImage(service.name)}
                  alt={service.name}
                  fill
                  className="object-cover transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              </div>
            </div>
          ))}
          <div className="group p-8 rounded-3xl bg-base-primary/30 text-black border border-transparent hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col justify-center items-center text-center">
            <h3 className="text-2xl font-serif mb-2">Need Advice?</h3>
            <p className=" text-sm mb-6">Book a free 15-min consultation with a master stylist.</p>
            <button className="bg-white text-base-primary px-6 py-2 rounded-lg text-sm font-medium hover:bg-base-primary hover:text-white transition-colors">
              Book Consult
            </button>
          </div>
        </div>
      </section>

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

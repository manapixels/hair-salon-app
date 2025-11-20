'use client';

import { Button, Heading, Text, Grid, Container, Section } from '@radix-ui/themes';
import Image from 'next/image';
import BookingForm from './BookingForm';

export default function LandingPage() {
  return (
    <div className="bg-[#FDFCF8] min-h-screen text-stone-900 font-serif">
      {/* Hero Section */}
      <section className="relative h-[65vh] min-h-[500px] flex items-center justify-center overflow-hidden rounded-xl">
        <div className="absolute inset-0 z-0">
          <Image
            src="/interior-illustration.png"
            alt="Salon Interior"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[0px]"></div>
        </div>

        <div className="relative z-10 text-center max-w-3xl px-6">
          <Text size="2" className="uppercase tracking-[0.3em] mb-6 block text-stone-800 font-sans">
            Est. 2024
          </Text>
          <p className="text-xl md:text-2xl italic font-light mb-10 text-stone-800 max-w-xl mx-auto leading-relaxed">
            &quot;Where artistry meets elegance. A sanctuary for your style.&quot;
          </p>
        </div>
      </section>

      {/* Services Summary Section */}
      <Section size="3" className="bg-white">
        <Container size="4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[500px] rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=1000&auto=format&fit=crop"
                alt="Hair Styling Service"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <Text
                size="2"
                className="uppercase tracking-[0.2em] text-gold-600 font-sans mb-4 block"
              >
                Our Menu
              </Text>
              <Heading size="8" className="font-light mb-6">
                Services & Treatments
              </Heading>
              <p className="text-stone-600 leading-relaxed font-sans mb-8 text-lg">
                From precision cuts to transformative color and restorative treatments, our
                comprehensive menu is designed to enhance your natural beauty. Experience the finest
                in hair care.
              </p>

              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-6 h-6 text-stone-900"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                      />
                    </svg>
                  </div>
                  <div>
                    <Heading size="4" className="mb-1 font-normal">
                      Precision Cuts
                    </Heading>
                    <Text className="text-stone-500">
                      Tailored to your face shape and lifestyle.
                    </Text>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-6 h-6 text-stone-900"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                  </div>
                  <div>
                    <Heading size="4" className="mb-1 font-normal">
                      Color Artistry
                    </Heading>
                    <Text className="text-stone-500">
                      Vibrant, long-lasting color and balayage.
                    </Text>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-6 h-6 text-stone-900"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                  </div>
                  <div>
                    <Heading size="4" className="mb-1 font-normal">
                      Treatments
                    </Heading>
                    <Text className="text-stone-500">
                      Restorative care for healthy, shiny hair.
                    </Text>
                  </div>
                </div>
              </div>

              <Button
                size="3"
                variant="outline"
                className="cursor-pointer hover:bg-stone-50"
                onClick={() => (window.location.href = '/services')}
              >
                View Full Menu
              </Button>
            </div>
          </div>
        </Container>
      </Section>

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

      {/* Stylists - Gallery Style */}
      <Section size="3" className="bg-white">
        <Container size="4">
          <div className="text-center mb-20">
            <Text
              size="2"
              className="uppercase tracking-[0.2em] text-gold-600 font-sans mb-4 block"
            >
              The Team
            </Text>
            <Heading size="8" className="font-light">
              Master Stylists
            </Heading>
          </div>

          <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="8">
            {[
              {
                name: 'Elena Rossi',
                role: 'Creative Director',
                img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
              },
              {
                name: 'David Chen',
                role: 'Color Specialist',
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
              },
              {
                name: 'Sarah James',
                role: 'Senior Stylist',
                img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop',
              },
            ].map(stylist => (
              <div key={stylist.name} className="group">
                <div className="relative aspect-[3/4] overflow-hidden mb-6 bg-stone-100">
                  <Image
                    src={stylist.img}
                    alt={stylist.name}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <Heading size="4" className="font-normal mb-1">
                  {stylist.name}
                </Heading>
                <Text
                  size="2"
                  className="text-stone-500 font-sans uppercase tracking-wider text-xs"
                >
                  {stylist.role}
                </Text>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>
    </div>
  );
}

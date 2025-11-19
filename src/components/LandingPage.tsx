'use client';

import { Theme, Button, Heading, Text, Grid, Container, Section } from '@radix-ui/themes';
import Image from 'next/image';
import BookingForm from './BookingForm';

export default function LandingPage() {
  return (
    <div className="bg-[#FDFCF8] min-h-screen text-stone-900 font-serif">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=2574&auto=format&fit=crop"
            alt="Salon Interior"
            fill
            className="object-cover opacity-90 grayscale-[20%]"
            priority
          />
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 text-center max-w-3xl px-6">
          <Text size="2" className="uppercase tracking-[0.3em] mb-6 block text-stone-800 font-sans">
            Est. 2024
          </Text>
          <h1 className="text-6xl md:text-8xl font-light mb-8 tracking-tight text-stone-900">
            Luxe Cuts
          </h1>
          <p className="text-xl md:text-2xl italic font-light mb-10 text-stone-800 max-w-xl mx-auto leading-relaxed">
            &quot;Where artistry meets elegance. A sanctuary for your style.&quot;
          </p>
          <Button
            size="4"
            variant="outline"
            className="bg-transparent border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-all px-10 py-6 uppercase tracking-widest text-xs font-sans border-2 cursor-pointer"
            onClick={() => {
              document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Book Appointment
          </Button>
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
                <div className="aspect-[3/4] overflow-hidden mb-6 bg-stone-100">
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

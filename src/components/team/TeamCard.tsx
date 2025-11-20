import { Heading, Text, Container, Section, Badge } from '@radix-ui/themes';
import Image from 'next/image';

export default function TeamCard() {
  return (
    <Section size="3" className="bg-stone-50">
      <Container size="3">
        <div className="text-center mb-12">
          <Text size="2" className="uppercase tracking-[0.2em] text-gold-600 font-sans mb-4 block">
            Meet the Expert
          </Text>
          <Heading size="8" className="font-light text-stone-900">
            Our Stylist
          </Heading>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative w-full md:w-2/5 min-h-[400px]">
            <Image
              src="/may.jpg"
              alt="May"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-12 flex flex-col justify-center w-full md:w-3/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Heading size="6" className="font-normal text-stone-900 mb-1">
                  May
                </Heading>
                <Text size="2" className="text-stone-500 uppercase tracking-wider">
                  Creative Director
                </Text>
              </div>
              <div className="flex gap-2">
                <Badge color="gold" variant="soft" radius="full">
                  Cuts
                </Badge>
                <Badge color="gold" variant="soft" radius="full">
                  Color
                </Badge>
                <Badge color="gold" variant="soft" radius="full">
                  Treatment
                </Badge>
              </div>
            </div>

            <p className="text-stone-600 leading-relaxed font-sans mb-8">
              May specializes in creating personalized looks that flatters your features and fits
              your lifestyle. With a keen eye for detail, she ensures every client leaves feeling
              confident and refreshed.
            </p>

            <div className="grid grid-cols-2 gap-6 border-t border-stone-100 pt-6">
              <div>
                <Text
                  size="1"
                  className="uppercase text-stone-400 font-bold tracking-wider block mb-1"
                >
                  Experience
                </Text>
                <Text size="3" className="text-stone-800">
                  20+ Years
                </Text>
              </div>
              <div>
                <Text
                  size="1"
                  className="uppercase text-stone-400 font-bold tracking-wider block mb-1"
                >
                  Specialty
                </Text>
                <Text size="3" className="text-stone-800">
                  Asian Hair
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

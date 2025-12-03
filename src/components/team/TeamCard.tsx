'use client';

import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function TeamCard() {
  return (
    <section className="bg-stone-50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 sm:mb-12">
          <span className="uppercase tracking-[0.2em] text-accent-foreground font-sans mb-2 sm:mb-4 block text-sm">
            Meet the Expert
          </span>
          <h2 className="text-4xl font-light text-stone-900">Our Stylist</h2>
        </div>

        <div className="max-w-4xl mx-auto sm:bg-white rounded-2xl overflow-hidden sm:shadow-sm border border-stone-100 flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative w-4/5 md:w-2/5 min-h-[300px] sm:min-h-[400px] mx-auto">
            <Image
              src="/may.jpg"
              alt="May"
              fill
              className="object-cover rounded-2xl sm:rounded-none"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-12 flex flex-col justify-center w-full md:w-3/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-normal text-stone-900 mb-1">May</h3>
                <p className="text-sm text-stone-500 uppercase tracking-wider">Creative Director</p>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-full bg-secondary text-accent-foreground hover:bg-secondary/80"
                >
                  Cuts
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full bg-secondary text-accent-foreground hover:bg-secondary/80"
                >
                  Color
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full bg-secondary text-accent-foreground hover:bg-secondary/80"
                >
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
                <span className="uppercase text-stone-400 font-bold tracking-wider block mb-1 text-xs">
                  Experience
                </span>
                <p className="text-lg text-stone-800">20+ Years</p>
              </div>
              <div>
                <span className="uppercase text-stone-400 font-bold tracking-wider block mb-1 text-xs">
                  Specialty
                </span>
                <p className="text-lg text-stone-800">Asian Hair</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

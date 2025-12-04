'use client';

import { MapPin } from '@/lib/icons';

interface LocationCardProps {
  address: string;
}

export default function LocationCard({ address }: LocationCardProps) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="absolute bottom-6 right-6 max-w-[320px] bg-white/80 backdrop-blur-md border border-stone-200 rounded-xl shadow-lg p-5 z-20 hidden md:block">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-[hsl(var(--primary))]" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-stone-900 mb-1.5 font-sans uppercase tracking-wide">
            Visit Us
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed font-sans mb-3">{address}</p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs font-medium text-primary hover:text-[hsl(var(--primary))] transition-colors font-sans uppercase tracking-wider"
          >
            Get Directions
            <svg
              className="w-3.5 h-3.5 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

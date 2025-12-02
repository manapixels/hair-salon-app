'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { Grid, ChevronUp, Palette, Wind, Sparkles, Droplets, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { SERVICE_LINKS } from '@/config/navigation';

interface ServicesDropupProps {
  isOpen: boolean;
  onToggle: () => void;
  active: boolean;
}

const iconMap: Record<string, any> = {
  '/services/hair-colouring': Palette,
  '/services/hair-rebonding': Wind,
  '/services/scalp-treatment': Sparkles,
  '/services/keratin-treatment': Droplets,
  '/services/hair-perm': Waves,
};

const serviceLinks = SERVICE_LINKS.map(service => ({
  ...service,
  label: service.title,
  icon: iconMap[service.href] || Sparkles,
}));

export default function ServicesDropup({ isOpen, onToggle, active }: ServicesDropupProps) {
  const dropupRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropupRef.current && !dropupRef.current.contains(event.target as Node)) {
        if (isOpen) onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onToggle]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onToggle]);

  return (
    <div ref={dropupRef} className="relative flex items-end justify-center">
      {/* Full-Width Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="
              absolute bottom-full left-0 right-0
              bg-white/95 backdrop-blur-xl
              border-t-2 border-[var(--accent-9)]
              shadow-[0_-4px_16px_rgba(0,0,0,0.12)]
              max-h-[calc(100vh-180px)]
              overflow-y-auto
              z-[51]
            "
            id="services-dropdown"
            role="menu"
            aria-label="Service options"
          >
            {/* Header */}
            <div className="px-6 py-3 border-b border-gray-200/50">
              <h3 className="text-sm font-semibold text-[var(--gray-12)]">Our Services</h3>
            </div>

            {/* Service Grid - 2 Columns */}
            <div className="px-4 py-4 grid grid-cols-2 gap-3">
              {serviceLinks.map((service, index) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.href}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                  >
                    <Link
                      href={service.href}
                      onClick={onToggle}
                      className="
                        flex items-center gap-3 px-4 py-4
                        rounded-xl
                        bg-white hover:bg-[var(--accent-2)]
                        border border-gray-200/50
                        transition-all duration-200
                        touch-target
                        group
                      "
                      role="menuitem"
                    >
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--accent-3)] group-hover:bg-[var(--accent-4)] transition-colors">
                        <Icon className="w-5 h-5 text-[var(--accent-11)]" />
                      </div>
                      <span className="text-sm font-medium text-[var(--gray-12)] group-hover:text-[var(--accent-11)] transition-colors">
                        {service.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Region for Screen Readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {isOpen ? 'Services menu opened' : ''}
      </div>

      {/* Trigger Button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onToggle}
        className={`
          flex flex-col items-center justify-center
          min-w-[56px] min-h-[56px]
          px-3 py-2
          relative
          transition-all duration-300 ease-out
          ${
            active || isOpen
              ? 'text-[var(--accent-11)]'
              : 'text-[var(--gray-10)] hover:text-[var(--gray-12)]'
          }
        `}
        aria-label="Services menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="services-dropdown"
      >
        <div
          className={`
          relative
          transition-all duration-300 ease-out
          ${active || isOpen ? 'scale-110' : 'scale-100'}
        `}
        >
          <Grid
            className={`w-6 h-6 transition-all duration-300 ${active || isOpen ? 'stroke-[2.5]' : 'stroke-2'}`}
          />

          {/* Chevron Indicator */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute -bottom-0.5 right-0"
          >
            <ChevronUp className="w-3 h-3" />
          </motion.div>

          {active && !isOpen && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent-9)]"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </div>

        <span
          className={`text-[10px] mt-1 transition-all duration-300 ${active || isOpen ? 'font-semibold' : 'font-medium'}`}
        >
          Services
        </span>
      </motion.button>
    </div>
  );
}

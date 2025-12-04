'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ChevronRight } from 'lucide-react';
import type { ServiceLink } from '@/lib/categories';
import { useTranslations } from 'next-intl';

interface ServicesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  serviceLinks: ServiceLink[];
}

export default function ServicesPopup({ isOpen, onClose, serviceLinks }: ServicesPopupProps) {
  const t = useTranslations('ServicesPopup');
  const tNav = useTranslations('Navigation');
  const pathname = usePathname();

  // Filter out 'haircut' as it has no dedicated page
  const filteredServiceLinks = serviceLinks.filter(service => service.slug !== 'haircut');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Popup Menu */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-20 left-4 right-4 z-50 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{t('title')}</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Links */}
            <div className="py-2 space-y-1">
              {filteredServiceLinks.map(service => {
                const isActive = pathname === service.href;
                return (
                  <Link
                    key={service.href}
                    href={service.href}
                    onClick={onClose}
                    className={`
                      flex items-center justify-between px-5 py-3 mx-3 rounded-full transition-all duration-200 group
                      ${isActive ? 'bg-primary/10' : 'hover:bg-gray-100'}
                    `}
                  >
                    <span
                      className={`
                        text-sm font-medium transition-colors
                        ${
                          isActive
                            ? 'text-primary font-semibold'
                            : 'text-gray-700 group-hover:text-gray-900'
                        }
                      `}
                    >
                      {tNav(`serviceNames.${service.slug}`)}
                    </span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    {!isActive && (
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    )}
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="border-t border-gray-200 mx-3 my-2" />

              {/* Pricing Link */}
              <Link
                href="/prices"
                onClick={onClose}
                className="flex items-center justify-between px-5 py-3 mx-3 rounded-full transition-all duration-200"
              >
                <span className="text-sm font-semibold text-primary">{t('viewPriceList')}</span>
                <ChevronRight className="w-4 h-4 text-primary" />
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

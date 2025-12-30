'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Instagram, Facebook, FileText, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SkeletonLoader } from '@/components/feedback/loaders/SkeletonLoader';
import { useTranslations } from 'next-intl';

interface InfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdminSettings {
  businessAddress?: string;
  weeklySchedule?: {
    [key: string]: {
      isOpen: boolean;
      openingTime: string;
      closingTime: string;
    };
  };
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export default function InfoPopup({ isOpen, onClose }: InfoPopupProps) {
  const t = useTranslations('InfoPopup');
  const tCommon = useTranslations('Common');
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  // Fetch admin settings for location & hours
  useEffect(() => {
    if (isOpen && !settings) {
      fetch('/api/admin/settings')
        .then(res => res.json())
        .then(data => setSettings(data as AdminSettings))
        .catch(console.error);
    }
  }, [isOpen, settings]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}${minutes !== '00' ? ':' + minutes : ''}${ampm}`;
  };

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
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
              <h3 className="text-lg font-semibold text-gray-900">{t('title')}</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-6 space-y-8">
              {/* Location */}
              {!settings ? (
                <section>
                  <div className="flex items-start gap-3">
                    <SkeletonLoader height="h-9" className="w-9" />
                    <div className="flex-1 space-y-2">
                      <SkeletonLoader height="h-4" className="w-24" />
                      <SkeletonLoader height="h-4" className="w-full" />
                    </div>
                  </div>
                </section>
              ) : (
                settings.businessAddress && (
                  <section>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          {t('location')}
                        </h3>
                        <p className="text-sm text-gray-600">{settings.businessAddress}</p>
                      </div>
                    </div>
                  </section>
                )
              )}

              {/* Operating Hours */}
              {!settings ? (
                <section>
                  <div className="flex items-start gap-3">
                    <SkeletonLoader height="h-9" className="w-9" />
                    <div className="flex-1 space-y-3">
                      <SkeletonLoader height="h-4" className="w-32" />
                      <div className="space-y-2">
                        <SkeletonLoader count={7} height="h-4" className="w-full" />
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                settings.weeklySchedule && (
                  <section>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                          {t('operatingHours')}
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(settings.weeklySchedule).map(([day, schedule]) => (
                            <div key={day} className="flex justify-between text-sm">
                              <span className="text-gray-600 capitalize">
                                {tCommon(`days.${day}`)}
                              </span>
                              <span className={schedule.isOpen ? 'text-gray-900' : 'text-red-500'}>
                                {schedule.isOpen
                                  ? `${formatTime(schedule.openingTime)} - ${formatTime(schedule.closingTime)}`
                                  : t('closed')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                )
              )}

              {/* Social Media */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('connectWithUs')}</h3>
                <div className="flex items-center gap-3">
                  {/* Instagram */}
                  <a
                    href="https://instagram.com/signaturetrims"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-colors touch-target"
                    aria-label="Follow us on Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>

                  {/* Facebook */}
                  <a
                    href="https://facebook.com/signaturetrims"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-colors touch-target"
                    aria-label="Follow us on Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>

                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/1234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-colors touch-target"
                    aria-label="Chat with us on WhatsApp"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                  </a>
                </div>
              </section>

              {/* Legal */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('legal')}</h3>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/privacy"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
                    onClick={onClose}
                  >
                    <Shield className="w-4 h-4" />
                    {t('privacyPolicy')}
                  </Link>
                  <Link
                    href="/terms"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
                    onClick={onClose}
                  >
                    <FileText className="w-4 h-4" />
                    {t('termsOfService')}
                  </Link>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

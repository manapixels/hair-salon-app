'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Instagram, Facebook, FileText, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SkeletonLoader } from '@/components/feedback/loaders/SkeletonLoader';
import { useTranslations } from 'next-intl';
import { WhatsAppIcon, TelegramIcon } from '@/lib/icons';

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
                      <SkeletonLoader height="h-4" className="w-2/3" />
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
                        {/* 7 days of hours */}
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <SkeletonLoader height="h-4" className="w-20" />
                            <SkeletonLoader height="h-4" className="w-24" />
                          </div>
                        ))}
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

                  {/* Telegram */}
                  <a
                    href="https://t.me/hair_salon_app_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-colors touch-target"
                    aria-label="Chat with us on Telegram"
                  >
                    <TelegramIcon className="w-4 h-4" />
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

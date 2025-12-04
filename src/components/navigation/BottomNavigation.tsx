'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Home, Calendar, User, Scissors, MapPinned } from 'lucide-react';
import BottomNavItem from './BottomNavItem';
import ServicesPopup from './ServicesPopup';
import InfoPopup from './InfoPopup';
import AccountPopup from './AccountPopup';
import { useAuth } from '@/context/AuthContext';
import { useBookingModal } from '@/context/BookingModalContext';
import type { ServiceLink } from '@/lib/categories';
import { useTranslations } from 'next-intl';

interface BottomNavigationProps {
  serviceLinks: ServiceLink[];
}

export default function BottomNavigation({ serviceLinks }: BottomNavigationProps) {
  const t = useTranslations('Navigation');
  const pathname = usePathname();
  const { user } = useAuth();
  const { openModal } = useBookingModal();
  const [activeTab, setActiveTab] = useState('home');
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showInfoDropdown, setShowInfoDropdown] = useState(false);

  // Detect active tab from pathname
  useEffect(() => {
    if (pathname === '/') {
      setActiveTab('home');
    } else if (pathname.startsWith('/services')) {
      setActiveTab('services');
    } else if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      setActiveTab('dashboard');
    } else {
      setActiveTab('');
    }
  }, [pathname]);

  // Close all dropdowns when route changes
  useEffect(() => {
    setShowServicesDropdown(false);
    setShowAccountDropdown(false);
    setShowInfoDropdown(false);
  }, [pathname]);

  const toggleServices = () => {
    const newState = !showServicesDropdown;
    setShowServicesDropdown(newState);
    if (newState) {
      setShowAccountDropdown(false);
      setShowInfoDropdown(false);
    }
  };

  const toggleAccount = () => {
    const newState = !showAccountDropdown;
    setShowAccountDropdown(newState);
    if (newState) {
      setShowServicesDropdown(false);
      setShowInfoDropdown(false);
    }
  };

  const toggleInfo = () => {
    const newState = !showInfoDropdown;
    setShowInfoDropdown(newState);
    if (newState) {
      setShowServicesDropdown(false);
      setShowAccountDropdown(false);
    }
  };

  return (
    <>
      {/* Popups */}
      <ServicesPopup
        isOpen={showServicesDropdown}
        onClose={() => setShowServicesDropdown(false)}
        serviceLinks={serviceLinks}
      />

      <InfoPopup isOpen={showInfoDropdown} onClose={() => setShowInfoDropdown(false)} />

      <AccountPopup isOpen={showAccountDropdown} onClose={() => setShowAccountDropdown(false)} />

      {/* Bottom Navigation Bar */}
      <nav
        className="
          md:hidden fixed bottom-0 left-0 right-0 z-50
          bg-white/80 backdrop-blur-xl
          border-t border-accent/20
          pb-safe-bottom
        "
        role="navigation"
        aria-label="Primary mobile navigation"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {/* 1. Home */}
          <BottomNavItem icon={Home} label={t('home')} active={activeTab === 'home'} href="/" />

          {/* 2. Services */}
          <div className="relative flex justify-center">
            <BottomNavItem
              icon={Scissors}
              label={t('services')}
              active={activeTab === 'services'}
              isOpen={showServicesDropdown}
              onClick={toggleServices}
            />
          </div>

          {/* 3. Book (CTA) */}
          <div className="flex justify-center relative z-10">
            <BottomNavItem
              icon={Calendar}
              label={t('book')}
              active={false}
              variant="primary"
              onClick={() => openModal()}
            />
          </div>

          {/* 4. Info */}
          <BottomNavItem
            icon={MapPinned}
            label={t('info')}
            active={false}
            isOpen={showInfoDropdown}
            onClick={toggleInfo}
          />

          {/* 5. Account */}
          <div className="relative flex justify-center">
            <BottomNavItem
              icon={User}
              label={user ? t('account') : t('login')}
              active={activeTab === 'dashboard'}
              isOpen={showAccountDropdown}
              isAdmin={user?.role === 'ADMIN'}
              onClick={toggleAccount}
            />
          </div>
        </div>
      </nav>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Calendar, Info, User, Scissors, MapPin, MapPinned } from 'lucide-react';
import BottomNavItem from './BottomNavItem';
import MenuDrawer from './MenuDrawer';
import { useAuth } from '@/context/AuthContext';

export default function BottomNavigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

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

  // Close both dropdowns when route changes
  useEffect(() => {
    setShowServicesDropdown(false);
    setShowAccountDropdown(false);
  }, [pathname]);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className="
          md:hidden fixed bottom-0 left-0 right-0 z-50
          bg-white/80 backdrop-blur-xl
          border-t border-base-primary/20
          pb-safe-bottom
        "
        role="navigation"
        aria-label="Primary mobile navigation"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {/* 1. Home */}
          <BottomNavItem icon={Home} label="Home" active={activeTab === 'home'} href="/" />

          {/* 2. Services */}
          <div className="relative flex justify-center">
            <BottomNavItem
              icon={Scissors}
              label="Services"
              active={activeTab === 'services'}
              onClick={() => {
                setShowServicesDropdown(!showServicesDropdown);
                if (!showServicesDropdown) setShowAccountDropdown(false);
              }}
            />
          </div>

          {/* 3. Book (CTA) */}
          <div className="flex justify-center relative z-10">
            <BottomNavItem
              icon={Calendar}
              label="Book"
              active={false}
              href="/?view=booking"
              variant="primary"
              onClick={() => {
                // Optional: If you need to force a scroll or state update, handle it here.
              }}
            />
          </div>

          {/* 4. Info (Menu Drawer) */}
          <BottomNavItem
            icon={MapPinned}
            label="Info"
            active={false}
            onClick={() => setShowMenuDrawer(true)}
          />

          {/* 5. Account */}
          <div className="relative flex justify-center">
            <BottomNavItem
              icon={User}
              label="Account"
              active={activeTab === 'dashboard'}
              onClick={() => {
                setShowAccountDropdown(!showAccountDropdown);
                if (!showAccountDropdown) setShowServicesDropdown(false);
              }}
            />
          </div>
        </div>
      </nav>

      {/* Menu Drawer */}
      <MenuDrawer isOpen={showMenuDrawer} onClose={() => setShowMenuDrawer(false)} />
    </>
  );
}

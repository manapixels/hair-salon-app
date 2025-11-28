'use client';

import { Dialog } from '@radix-ui/themes';
import {
  X,
  ChevronRight,
  ChevronDown,
  Calendar,
  User as UserIcon,
  Shield,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import { useState } from 'react';
import { Badge, Button } from '@/components/ui';
import * as Avatar from '@radix-ui/react-avatar';
import { User } from '@/types';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  activeView: 'booking' | 'admin' | 'dashboard' | 'services';
  onLogout: () => void | Promise<void>;
  onLoginClick: () => void;
}

const serviceLinks = [
  { href: '/services/hair-colouring', label: 'Colouring' },
  { href: '/services/hair-rebonding', label: 'Rebonding' },
  { href: '/services/scalp-treatment', label: 'Scalp Treatment' },
  { href: '/services/keratin-treatment', label: 'Keratin Treatment' },
  { href: '/services/hair-perm', label: 'Perm' },
];

/**
 * Mobile navigation drawer with full-screen overlay
 * Provides touch-friendly navigation for mobile devices
 */
export function MobileMenuDrawer({
  isOpen,
  onClose,
  user,
  activeView,
  onLogout,
  onLoginClick,
}: MobileMenuDrawerProps) {
  const router = useRouter();
  const [servicesExpanded, setServicesExpanded] = useState(false);

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleLogout = async () => {
    await onLogout();
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Dialog.Content className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-bottom duration-300 rounded-xl w-[90%] max-w-full h-[80%] p-0 bottom-16">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 mb-0 flex items-center justify-between z-10 w-full">
          <div className="relative h-10 w-30">
            <Logo className="h-full w-full text-black" />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <VisuallyHidden>
          <Dialog.Title></Dialog.Title>
        </VisuallyHidden>

        {/* User Profile Section */}
        {user ? (
          <div className="px-6 py-6 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between">
              <div className="flex items-center gap-3">
                <Avatar.Root className="h-12 w-12">
                  <Avatar.Image
                    src={user.avatar || ''}
                    alt={user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                  <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-accent text-lg font-semibold text-white">
                    {user.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900">{user.name}</p>
                  <Badge className="mt-1 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    {user.role === 'ADMIN' ? 'Admin' : 'Customer'}
                  </Badge>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-auto flex items-center justify-center gap-3 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors touch-target font-medium"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            onClick={() => {
              onLoginClick();
              onClose();
            }}
          >
            Sign In
          </Button>
        )}

        {/* Navigation Links */}
        <nav className="px-4 py-6">
          {/* Book Now - Primary CTA */}
          <button
            onClick={() => handleNavigation('/')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all touch-target ${
              activeView === 'booking'
                ? 'bg-accent text-white shadow-md'
                : 'hover:bg-gray-100 text-gray-900'
            }`}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-lg font-medium flex-1 text-left">Book Now</span>
          </button>

          {/* Services Accordion */}
          <div className="mt-2">
            <button
              onClick={() => setServicesExpanded(!servicesExpanded)}
              className="w-full flex px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors touch-target"
              style={{ justifyContent: 'start' }}
            >
              <span className="text-lg font-medium text-gray-900">Our Services</span>
              <ChevronDown
                className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
                  servicesExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Services List */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                servicesExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="pl-4 py-2 space-y-1">
                {serviceLinks.map(service => (
                  <Link
                    key={service.href}
                    href={service.href}
                    onClick={onClose}
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors touch-target group"
                  >
                    <span className="text-base text-gray-700 group-hover:text-accent">
                      {service.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent" />
                  </Link>
                ))}
                <Link
                  href="/services"
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors touch-target mt-2"
                >
                  <span className="text-base font-medium text-accent">View All Services</span>
                  <ChevronRight className="h-4 w-4 text-accent" />
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Link */}
          <button
            onClick={() => handleNavigation('/#contact')}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors touch-target mt-2"
            style={{ justifyContent: 'start' }}
          >
            <span className="text-lg font-medium text-gray-900">Contact Us</span>
          </button>

          {/* Divider */}
          <div className="h-px bg-gray-200 my-4" />

          {/* Dashboard (Customer only) */}
          {user && user.role === 'CUSTOMER' && (
            <button
              onClick={() => handleNavigation('/dashboard')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors touch-target ${
                activeView === 'dashboard'
                  ? 'bg-accent text-white'
                  : 'hover:bg-gray-100 text-gray-900'
              }`}
            >
              <UserIcon className="h-6 w-6" />
              <span className="text-lg font-medium flex-1 text-left">Dashboard</span>
            </button>
          )}

          {/* Admin Panel (Admin only) */}
          {user && user.role === 'ADMIN' && (
            <button
              onClick={() => handleNavigation('/admin')}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-colors touch-target ${
                activeView === 'admin' ? 'bg-accent text-white' : 'hover:bg-gray-100 text-gray-900'
              }`}
            >
              <Shield className="h-6 w-6" />
              <span className="text-lg font-medium flex-1 text-left">Admin Panel</span>
            </button>
          )}
        </nav>
      </Dialog.Content>
    </Dialog.Root>
  );
}

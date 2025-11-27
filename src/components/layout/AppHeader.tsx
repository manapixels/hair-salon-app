'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import * as Avatar from '@radix-ui/react-avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import {
  Scissors,
  Calendar,
  User,
  Shield,
  Bell,
  LogIn,
  LogOut,
  Sparkles,
  ChevronDown,
} from '@/lib/icons';
import Image from 'next/image';
import Link from 'next/link';
import Logo from './Logo';
import { ServiceCategory } from '@/types';
import OAuthLoginModal from '../auth/OAuthLoginModal';

type View = 'booking' | 'admin' | 'dashboard' | 'services';

interface AppHeaderProps {
  view?: View;
  onViewChange?: (view: View) => void;
}

const NotificationBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;

  const displayCount = count > 9 ? '9+' : count.toString();

  return (
    <span
      className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold border-2 border-white dark:border-gray-800 shadow-md"
      aria-hidden="true"
    >
      {displayCount}
    </span>
  );
};

export default function AppHeader({ view, onViewChange }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  const activeView: View = useMemo(() => {
    if (pathname?.startsWith('/admin')) return 'admin';
    if (pathname?.startsWith('/dashboard')) return 'dashboard';
    if (pathname?.startsWith('/services')) return 'services';
    return 'booking';
  }, [pathname]);

  useEffect(() => {
    if (view && activeView !== view && onViewChange) {
      onViewChange(activeView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  // Fetch services for the mega menu
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch services for menu:', error);
      }
    };
    fetchServices();
  }, []);

  // Fetch appointment count for customers
  useEffect(() => {
    if (user && user.role === 'CUSTOMER') {
      const fetchCount = async () => {
        try {
          const response = await fetch('/api/appointments/count');
          if (response.ok) {
            const data = await response.json();
            setAppointmentCount(data.count);
          }
        } catch (error) {
          console.error('Failed to fetch appointment count:', error);
        }
      };

      fetchCount();

      // Refresh count when window regains focus
      const handleFocus = () => fetchCount();
      window.addEventListener('focus', handleFocus);

      return () => window.removeEventListener('focus', handleFocus);
    } else {
      setAppointmentCount(0);
    }
  }, [user]);

  // Handle OAuth redirect results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loginStatus = urlParams.get('login');
    const error = urlParams.get('error');

    if (loginStatus === 'success') {
      // Clear URL parameters and trigger auth state refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      // Force AuthContext to re-check session without full page reload
      window.dispatchEvent(new Event('auth-refresh'));
      // Show success toast
      toast.success('Logged in successfully!');
    } else if (error) {
      // Handle OAuth errors
      const errorMessages: { [key: string]: string } = {
        whatsapp_oauth_denied: 'WhatsApp login was cancelled',
        telegram_auth_failed: 'Telegram authentication failed',
        invalid_telegram_data: 'Invalid Telegram data received',
        telegram_data_expired: 'Telegram authentication data expired',
        invalid_telegram_auth: 'Telegram authentication verification failed',
        whatsapp_oauth_failed: 'WhatsApp authentication failed',
        invalid_oauth_response: 'Invalid OAuth response',
        invalid_state: 'Invalid OAuth state parameter',
        missing_token: 'Login link is missing authentication token',
        invalid_or_expired_token: 'Login link is invalid or has expired',
        token_expired: 'Login link has expired. Please try logging in again',
        user_not_found: 'User account not found. Please contact support',
        login_failed: 'Login failed. Please try again or contact support',
      };

      const errorMessage = errorMessages[error] || 'Authentication failed';
      toast.error(errorMessage);

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleNavigation = (targetView: View, path: string) => {
    if (activeView !== targetView) {
      router.push(path);
      if (onViewChange) {
        onViewChange(targetView);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-base-primary/10 bg-stone-50 bg-opacity-50 backdrop-blur-md transition-all duration-300 dark:border-gray-800 dark:bg-gray-900">
      <nav className="w-full flex items-center justify-between px-6 py-3 lg:px-12">
        <div className="flex items-center gap-1.5">
          <div className="relative h-12 w-48 cursor-pointer" onClick={() => router.push('/')}>
            <Logo className="h-full w-full text-black dark:text-white" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-6 sm:flex">
            {/* Mega Menu / Dropdown for Services */}
            <div className="static group" onMouseEnter={() => setIsMegaMenuOpen(true)}>
              <button
                className={`flex items-center gap-1 text-sm font-medium transition-colors h-full py-3 text-black font-semibold`}
                onClick={() => handleNavigation('services', '/services')}
              >
                Our Services
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Full Width Mega Menu Overlay */}
              <div
                className={`fixed left-0 top-[73px] w-screen bg-[var(--accent-9)] text-white transition-all duration-300 ease-in-out z-50 shadow-2xl border-t border-[var(--accent-8)] ${isMegaMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onMouseLeave={() => setIsMegaMenuOpen(false)}
              >
                <div className="mx-auto">
                  <div className="grid grid-cols-12">
                    {/* Left Column: Image */}
                    <div className="col-span-7 flex items-center justify-center gap-8">
                      <div className="relative w-full h-full transition-transform duration-500">
                        <Image
                          src="/background-images/menu-service-bg.png"
                          alt="Hime Cut"
                          fill
                          className="object-cover opacity-80 group-hover/img:opacity-100 transition-opacity rounded-lg"
                        />
                      </div>
                    </div>
                    {/* Right Column: Featured Services List */}
                    <div className="col-span-5 space-y-2 px-6 lg:px-16 py-12">
                      {/* Featured Services - Direct links to service detail pages */}
                      <Link
                        href="/services/hair-colouring"
                        onClick={() => setIsMegaMenuOpen(false)}
                        className="group/item flex items-center justify-between py-4 border-b border-[var(--accent-7)] hover:border-white transition-colors"
                      >
                        <span className="text-2xl font-light tracking-wide group-hover/item:text-white text-white/90 transition-colors">
                          Colouring
                        </span>
                        <div className="w-10 h-10 rounded-full border border-[var(--accent-8)] flex items-center justify-center group-hover/item:border-white group-hover/item:bg-white group-hover/item:text-[var(--accent-11)] transition-all">
                          <ChevronDown className="w-5 h-5 -rotate-90" />
                        </div>
                      </Link>

                      <Link
                        href="/services/hair-rebonding"
                        onClick={() => setIsMegaMenuOpen(false)}
                        className="group/item flex items-center justify-between py-4 border-b border-[var(--accent-7)] hover:border-white transition-colors"
                      >
                        <span className="text-2xl font-light tracking-wide group-hover/item:text-white text-white/90 transition-colors">
                          Rebonding
                        </span>
                        <div className="w-10 h-10 rounded-full border border-[var(--accent-8)] flex items-center justify-center group-hover/item:border-white group-hover/item:bg-white group-hover/item:text-[var(--accent-11)] transition-all">
                          <ChevronDown className="w-5 h-5 -rotate-90" />
                        </div>
                      </Link>

                      <Link
                        href="/services/hair-treatment"
                        onClick={() => setIsMegaMenuOpen(false)}
                        className="group/item flex items-center justify-between py-4 border-b border-[var(--accent-7)] hover:border-white transition-colors"
                      >
                        <span className="text-2xl font-light tracking-wide group-hover/item:text-white text-white/90 transition-colors">
                          Treatment
                        </span>
                        <div className="w-10 h-10 rounded-full border border-[var(--accent-8)] flex items-center justify-center group-hover/item:border-white group-hover/item:bg-white group-hover/item:text-[var(--accent-11)] transition-all">
                          <ChevronDown className="w-5 h-5 -rotate-90" />
                        </div>
                      </Link>

                      <Link
                        href="/services/hair-perm"
                        onClick={() => setIsMegaMenuOpen(false)}
                        className="group/item flex items-center justify-between py-4 border-b border-[var(--accent-7)] hover:border-white transition-colors"
                      >
                        <span className="text-2xl font-light tracking-wide group-hover/item:text-white text-white/90 transition-colors">
                          Perm
                        </span>
                        <div className="w-10 h-10 rounded-full border border-[var(--accent-8)] flex items-center justify-center group-hover/item:border-white group-hover/item:bg-white group-hover/item:text-[var(--accent-11)] transition-all">
                          <ChevronDown className="w-5 h-5 -rotate-90" />
                        </div>
                      </Link>

                      <div className="pt-6">
                        <Link
                          href="/services"
                          onClick={() => setIsMegaMenuOpen(false)}
                          className="text-gold-400 hover:text-gold-300 text-sm uppercase tracking-widest font-semibold"
                        >
                          View All Services &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="text-sm font-medium text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors"
              onClick={() => router.push('/#contact')}
            >
              Contact Us
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

            <Button
              variant={activeView === 'booking' ? 'solid' : 'outline'}
              size="md"
              onClick={() => handleNavigation('booking', '/')}
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Book Now
            </Button>

            {user && user.role === 'CUSTOMER' && (
              <div className="relative">
                <Button
                  variant={activeView === 'dashboard' ? 'solid' : 'ghost'}
                  size="md"
                  onClick={() => handleNavigation('dashboard', '/dashboard')}
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  Dashboard
                </Button>
                <NotificationBadge count={appointmentCount} />
              </div>
            )}

            {user?.role === 'ADMIN' && (
              <Button
                variant={activeView === 'admin' ? 'solid' : 'soft'}
                size="md"
                onClick={() => handleNavigation('admin', '/admin')}
              >
                <Shield className="h-4 w-4" aria-hidden="true" />
                Admin
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && user.role === 'CUSTOMER' && (
              <button
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--gray-6)] bg-[var(--color-panel)] text-[var(--gray-11)] transition-colors hover:bg-[var(--gray-3)] hover:text-[var(--accent-11)] sm:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]"
                onClick={() => router.push('/dashboard')}
                aria-label={`Dashboard, ${appointmentCount} upcoming appointment${appointmentCount !== 1 ? 's' : ''}`}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                <NotificationBadge count={appointmentCount} />
              </button>
            )}
            {user ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    aria-label="User menu"
                  >
                    <Avatar.Root className="h-10 w-10">
                      <Avatar.Image
                        src={user.avatar}
                        alt={user.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                      <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                        {user.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </Avatar.Fallback>
                    </Avatar.Root>
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[220px] rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                    sideOffset={5}
                    align="end"
                  >
                    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      <span className="mt-1.5 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        {user.role === 'ADMIN' ? 'Admin' : 'Customer'}
                      </span>
                    </div>

                    {user.role === 'CUSTOMER' && activeView !== 'dashboard' && (
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-700 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                        onSelect={() => router.push('/dashboard')}
                      >
                        <User className="h-4 w-4" aria-hidden="true" />
                        <span>Dashboard</span>
                      </DropdownMenu.Item>
                    )}

                    {user.role === 'ADMIN' && activeView !== 'admin' && (
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-700 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                        onSelect={() => router.push('/admin')}
                      >
                        <Shield className="h-4 w-4" aria-hidden="true" />
                        <span>Admin Panel</span>
                      </DropdownMenu.Item>
                    )}

                    {((user.role === 'CUSTOMER' && activeView !== 'dashboard') ||
                      (user.role === 'ADMIN' && activeView !== 'admin')) && (
                      <DropdownMenu.Separator className="my-1.5 h-px bg-gray-100 dark:bg-gray-700" />
                    )}

                    <DropdownMenu.Item
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-red-600 outline-none transition-colors hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus:bg-red-900/20"
                      onSelect={async () => {
                        await logout();
                        router.push('/');
                        toast.success('Logged out successfully');
                      }}
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      <span>Logout</span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <Button variant="solid" size="md" onClick={() => setIsLoginOpen(true)}>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>
      <OAuthLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </header>
  );
}

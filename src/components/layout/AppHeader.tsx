'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Instagram, Facebook } from 'lucide-react';
import {
  Calendar,
  User,
  Shield,
  LogIn,
  LogOut,
  ChevronDown,
  WhatsAppIcon,
  TelegramIcon,
} from '@/lib/icons';
import Image from 'next/image';
import Link from 'next/link';
import Logo from './Logo';
import { ServiceCategory } from '@/types';
import type { ServiceLink } from '@/lib/categories';
import OAuthLoginModal from '../auth/OAuthLoginModal';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { useBookingModal } from '@/context/BookingModalContext';
import { isAdmin, isStylist, isCustomer, getPrimaryRole } from '@/lib/roleHelpers';
import { useAdminSettings } from '@/hooks/queries/useAdminSettings';

type View = 'booking' | 'admin' | 'dashboard' | 'services';

interface AppHeaderProps {
  view?: View;
  onViewChange?: (view: View) => void;
  serviceLinks: ServiceLink[];
}

const NotificationBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;

  const displayCount = count > 9 ? '9+' : count.toString();

  return (
    <span
      className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold border-2 border-white shadow-md"
      aria-hidden="true"
    >
      {displayCount}
    </span>
  );
};

export default function AppHeader({ view, onViewChange, serviceLinks }: AppHeaderProps) {
  const t = useTranslations('Layout.header');
  const tAccount = useTranslations('AccountPopup');
  const { user, logout } = useAuth();
  const { openModal } = useBookingModal();
  const router = useRouter();
  const pathname = usePathname();
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const { data: adminSettings } = useAdminSettings();

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
          const data = (await response.json()) as ServiceCategory[];
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
    if (user && isCustomer(user)) {
      const fetchCount = async () => {
        try {
          const response = await fetch('/api/appointments/count');
          if (response.ok) {
            const data = (await response.json()) as { count: number };
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
    <>
      {/* Desktop Header - Hidden on Mobile */}
      <header className="hidden xl:block sticky top-0 z-50 border-b border-primary/10 bg-stone-50 bg-opacity-50 backdrop-blur-md transition-all duration-300">
        <nav className="w-full flex items-center justify-between px-6 py-3 lg:px-12">
          <div className="flex items-center gap-6">
            <Link href="/" className="cursor-pointer">
              <Logo />
            </Link>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 sm:flex">
              {/* Mega Menu / Dropdown for Services */}
              <div className="static group" onMouseEnter={() => setIsMegaMenuOpen(true)}>
                <Button variant="ghost" className="px-2">
                  {t('services')}
                  <ChevronDown className="w-3 h-3" />
                </Button>

                {/* Full Width Mega Menu Overlay */}
                <div
                  className={`fixed left-0 top-[73px] w-full bg-primary text-white transition-all duration-300 ease-in-out z-50 shadow-2xl border-t border-primary ${isMegaMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                  onMouseLeave={() => setIsMegaMenuOpen(false)}
                >
                  <div className="mx-auto">
                    <div className="grid grid-cols-12">
                      {/* Left Column: Image */}
                      <div className="col-span-7 flex items-center justify-center gap-8">
                        <div className="relative w-full h-full transition-transform duration-500">
                          <Image
                            src="/images/background-images/menu-service-bg.png"
                            alt="Hime Cut"
                            fill
                            className="object-cover opacity-80 group-hover/img:opacity-100 transition-opacity rounded-lg"
                            sizes="(max-width: 768px) 100vw, 60vw"
                          />
                        </div>
                      </div>
                      {/* Right Column: Featured Services List */}
                      <div className="col-span-5 space-y-2 px-6 lg:px-16 py-12">
                        {/* Featured Services - Direct links to service detail pages */}
                        {serviceLinks.map(service => (
                          <Link
                            key={service.href}
                            href={service.href}
                            onClick={() => setIsMegaMenuOpen(false)}
                            className="group/item flex items-center justify-between py-4 border-b border-primary hover:border-white transition-colors"
                          >
                            <span className="text-2xl font-light tracking-wide group-hover/item:text-white text-white/90 transition-colors">
                              {service.title}
                            </span>
                            <div className="w-10 h-10 rounded-full border border-primary flex items-center justify-center group-hover/item:border-white group-hover/item:bg-white group-hover/item:text-primary transition-all">
                              <ChevronDown className="w-5 h-5 -rotate-90" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Button variant="ghost" className="px-2" onClick={() => router.push('/prices')}>
                {t('prices')}
              </Button>

              <div className="flex items-center gap-1 mx-2">
                {adminSettings?.socialLinks?.instagram?.isActive &&
                  adminSettings.socialLinks.instagram.url && (
                    <a
                      href={adminSettings.socialLinks.instagram.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full text-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                {adminSettings?.socialLinks?.facebook?.isActive &&
                  adminSettings.socialLinks.facebook.url && (
                    <a
                      href={adminSettings.socialLinks.facebook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full text-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                {adminSettings?.socialLinks?.whatsapp?.isActive &&
                  adminSettings.socialLinks.whatsapp.url && (
                    <a
                      href={adminSettings.socialLinks.whatsapp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full text-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="WhatsApp"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                    </a>
                  )}
                {adminSettings?.socialLinks?.telegram?.isActive &&
                  adminSettings.socialLinks.telegram.url && (
                    <a
                      href={adminSettings.socialLinks.telegram.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full text-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="Telegram"
                    >
                      <TelegramIcon className="w-4 h-4" />
                    </a>
                  )}
              </div>
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              <Button
                variant="outline"
                size="default"
                className="border-primary/50 bg-white/80 backdrop-blur-xs text-primary"
                onClick={() => openModal()}
              >
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {t('bookNow')}
              </Button>
              {/* Customer Dashboard Button */}
              {user && isCustomer(user) && (
                <div className="relative">
                  <Button
                    variant={activeView === 'dashboard' ? 'default' : 'ghost'}
                    size="default"
                    onClick={() => handleNavigation('dashboard', '/customer')}
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    {tAccount('dashboard')}
                  </Button>
                  <NotificationBadge count={appointmentCount} />
                </div>
              )}
              {/* Admin Dashboard Button */}
              {user && isAdmin(user) && (
                <Button
                  variant={activeView === 'admin' ? 'default' : 'outline'}
                  size="default"
                  className="bg-primary-50 hover:bg-primary-100"
                  onClick={() => handleNavigation('admin', '/admin')}
                >
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  {tAccount('adminDashboard')}
                </Button>
              )}
              {/* Stylist Dashboard Button - Now visible to Admins who are also Stylists */}
              {user && isStylist(user) && (
                <Button
                  variant={activeView === 'dashboard' ? 'default' : 'outline'}
                  size="default"
                  className="bg-primary-50 hover:bg-primary-100"
                  onClick={() => handleNavigation('dashboard', '/stylist')}
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  {tAccount('stylistDashboard')}
                </Button>
              )}
            </div>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="User menu"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.avatar}
                        alt={user.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                      <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                        {user.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="min-w-[220px] rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg"
                  sideOffset={5}
                  align="end"
                >
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{user.name}</p>
                    <div className="flex gap-1 items-center">
                      {user.email.endsWith('@whatsapp.local') ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800">
                          <WhatsAppIcon className="w-4 h-4 mr-1" />
                          WhatsApp {user.email.split('@')[0]}
                        </span>
                      ) : user.email.endsWith('@telegram.local') ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">
                          <TelegramIcon className="w-4 h-4 mr-1" />
                          Telegram
                        </span>
                      ) : (
                        <span className="inline-block rounded-full border border-gray-200 px-2 py-0.5 text-sm font-medium text-gray-500">
                          {user.email}
                        </span>
                      )}
                      <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                        {getPrimaryRole(user) === 'ADMIN'
                          ? 'Admin'
                          : getPrimaryRole(user) === 'STYLIST'
                            ? 'Stylist'
                            : 'Customer'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Dashboard Link */}
                  {isCustomer(user) && activeView !== 'dashboard' && (
                    <DropdownMenuItem
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-700 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                      onSelect={() => router.push('/customer')}
                    >
                      <User className="h-4 w-4" aria-hidden="true" />
                      <span>{tAccount('dashboard')}</span>
                    </DropdownMenuItem>
                  )}

                  {/* Stylist Dashboard Link - Added for Stylists */}
                  {isStylist(user) && activeView !== 'dashboard' && (
                    <DropdownMenuItem
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-700 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                      onSelect={() => router.push('/stylist')}
                    >
                      <User className="h-4 w-4" aria-hidden="true" />
                      <span>{tAccount('stylistDashboard')}</span>
                    </DropdownMenuItem>
                  )}

                  {/* Admin Dashboard Link */}
                  {isAdmin(user) && activeView !== 'admin' && (
                    <DropdownMenuItem
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-700 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                      onSelect={() => router.push('/admin')}
                    >
                      <Shield className="h-4 w-4" aria-hidden="true" />
                      <span>{tAccount('adminDashboard')}</span>
                    </DropdownMenuItem>
                  )}

                  {((isCustomer(user) && activeView !== 'dashboard') ||
                    (isAdmin(user) && activeView !== 'admin')) && (
                    <DropdownMenuSeparator className="my-1.5 h-px bg-gray-100" />
                  )}

                  <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-red-600 outline-none transition-colors hover:bg-red-50 focus:bg-red-50"
                    onSelect={async () => {
                      await logout();
                      router.push('/');
                      toast.success('Logged out successfully');
                    }}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>{tAccount('logOut')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="default" onClick={() => setIsLoginOpen(true)}>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {tAccount('logIn')}
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Modals - Available on all screen sizes */}
      <OAuthLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      {/* MobileMenuDrawer removed - replaced by BottomNavigation */}
    </>
  );
}

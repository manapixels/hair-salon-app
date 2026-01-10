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
import { Instagram, Facebook, Scissors } from 'lucide-react';
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
import { Badge } from '../ui/badge';

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
  const tNav = useTranslations('Navigation');
  const tAccount = useTranslations('AccountPopup');
  const tErrors = useTranslations('OAuthLoginErrors');
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
      toast.success(tAccount('loginSuccess'));
    } else if (error) {
      // Handle OAuth errors
      // Use translation logic: try to get specific error, fallback to default if key might not exist?
      // Since we know the keys, we can just use tErrors(error) if we trust the error code matches the key.
      // Ideally we check if it's a valid key or fallback.
      // For simplicity, we can do this:

      const errorMessage = [
        'whatsapp_oauth_denied',
        'telegram_auth_failed',
        'invalid_telegram_data',
        'telegram_data_expired',
        'invalid_telegram_auth',
        'whatsapp_oauth_failed',
        'invalid_oauth_response',
        'invalid_state',
        'missing_token',
        'invalid_or_expired_token',
        'token_expired',
        'user_not_found',
        'login_failed',
      ].includes(error)
        ? tErrors(error)
        : tErrors('default');

      toast.error(errorMessage);

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [tAccount, tErrors]);

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
                              {[
                                'haircut',
                                'hair-colouring',
                                'hair-perm',
                                'hair-rebonding',
                                'keratin-treatment',
                                'scalp-treatment',
                              ].includes(service.slug)
                                ? tNav(`serviceNames.${service.slug}`)
                                : service.title}
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
              <Link href="/prices">
                <Button variant="ghost" className="px-2">
                  {t('prices')}
                </Button>
              </Link>

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
              <Button variant="outline" onClick={() => openModal()}>
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {t('bookNow')}
              </Button>
              {/* Customer Dashboard Button */}
              {user && isCustomer(user) && (
                <div className="relative">
                  <Link href="/customer">
                    <Button variant={activeView === 'dashboard' ? 'default' : 'outline'}>
                      <User className="h-4 w-4" aria-hidden="true" />
                      {tAccount('dashboard')}
                    </Button>
                  </Link>
                  <NotificationBadge count={appointmentCount} />
                </div>
              )}
              {/* Admin Dashboard Button */}
              {user && isAdmin(user) && (
                <Link href="/admin">
                  <Button variant={activeView === 'admin' ? 'default' : 'outline'}>
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    {tAccount('adminDashboard')}
                  </Button>
                </Link>
              )}
              {/* Stylist Dashboard Button - Now visible to Admins who are also Stylists */}
              {user && isStylist(user) && (
                <Link href="/stylist">
                  <Button variant={activeView === 'dashboard' ? 'default' : 'outline'}>
                    <Scissors className="h-4 w-4" aria-hidden="true" />
                    {tAccount('stylistDashboard')}
                  </Button>
                </Link>
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
                        <Badge
                          variant="secondary"
                          className="inline-flex items-center whitespace-nowrap bg-green-100 hover:bg-green-100 text-green-800"
                        >
                          <WhatsAppIcon className="w-4 h-4 mr-1" />
                          WhatsApp {user.email.split('@')[0]}
                        </Badge>
                      ) : user.email.endsWith('@telegram.local') ? (
                        <Badge
                          variant="secondary"
                          className="inline-flex items-center whitespace-nowrap bg-blue-100 hover:bg-blue-100 text-blue-800"
                        >
                          <TelegramIcon className="w-4 h-4 mr-1" />@{user.email.split('@')[0]}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="inline-block whitespace-nowrap max-w-[200px] truncate"
                          title={user.email}
                        >
                          {user.email}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {getPrimaryRole(user) === 'ADMIN'
                          ? 'Admin'
                          : getPrimaryRole(user) === 'STYLIST'
                            ? 'Stylist'
                            : 'Customer'}
                      </Badge>
                    </div>
                  </div>

                  {/* Customer Dashboard Link */}
                  {isCustomer(user) && activeView !== 'dashboard' && (
                    <DropdownMenuItem
                      asChild
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-700 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                    >
                      <Link href="/customer">
                        <User className="h-4 w-4" aria-hidden="true" />
                        <span>{tAccount('dashboard')}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {/* Stylist Dashboard Link - Added for Stylists */}
                  {isStylist(user) && activeView !== 'dashboard' && (
                    <DropdownMenuItem
                      asChild
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-700 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                    >
                      <Link href="/stylist">
                        <User className="h-4 w-4" aria-hidden="true" />
                        <span>{tAccount('stylistDashboard')}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {/* Admin Dashboard Link */}
                  {isAdmin(user) && activeView !== 'admin' && (
                    <DropdownMenuItem
                      asChild
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-700 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
                    >
                      <Link href="/admin">
                        <Shield className="h-4 w-4" aria-hidden="true" />
                        <span>{tAccount('adminDashboard')}</span>
                      </Link>
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
                      toast.success(tAccount('logoutSuccess'));
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

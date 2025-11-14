'use client';

import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@radix-ui/themes';
import { cn } from '@/lib/utils';
import * as Avatar from '@radix-ui/react-avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

type View = 'booking' | 'admin' | 'dashboard';

interface AppHeaderProps {
  view: View;
  onViewChange: (view: View) => void;
  onLoginClick?: () => void;
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

export default function AppHeader({ view, onViewChange, onLoginClick }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [appointmentCount, setAppointmentCount] = useState(0);

  const activeView: View = useMemo(() => {
    if (pathname?.startsWith('/admin')) return 'admin';
    if (pathname?.startsWith('/dashboard')) return 'dashboard';
    return 'booking';
  }, [pathname]);

  useEffect(() => {
    if (activeView !== view) {
      onViewChange(activeView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

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

  return (
    <header className="border-b border-gray-100 bg-white/90 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90">
      <nav className="container mx-auto flex items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <i className="fa-solid fa-scissors mr-3 text-3xl text-accent"></i>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
            Luxe Cuts
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            <Button
              variant={activeView === 'booking' ? 'solid' : 'ghost'}
              className={cn('', activeView !== 'booking' && 'text-gray-600 dark:text-gray-300')}
              onClick={() => {
                if (activeView !== 'booking') {
                  router.push('/');
                  onViewChange('booking');
                }
              }}
            >
              <i className="fa-solid fa-calendar-check" aria-hidden="true"></i>
              Book Online
            </Button>

            {user && user.role === 'CUSTOMER' && (
              <div className="relative">
                <Button
                  variant={activeView === 'dashboard' ? 'solid' : 'ghost'}
                  className={cn(
                    '',
                    activeView !== 'dashboard' && 'text-gray-600 dark:text-gray-300',
                  )}
                  onClick={() => {
                    if (activeView !== 'dashboard') {
                      router.push('/dashboard');
                      onViewChange('dashboard');
                    }
                  }}
                >
                  <i className="fa-solid fa-user" aria-hidden="true"></i>
                  Dashboard
                </Button>
                <NotificationBadge count={appointmentCount} />
              </div>
            )}

            {user?.role === 'ADMIN' && (
              <Button
                variant={activeView === 'admin' ? 'solid' : 'soft'}
                className={cn('', activeView !== 'admin' && 'text-gray-600 dark:text-gray-300')}
                onClick={() => {
                  if (activeView !== 'admin') {
                    router.push('/admin');
                    onViewChange('admin');
                  }
                }}
              >
                <i className="fa-solid fa-user-shield" aria-hidden="true"></i>
                Admin
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && user.role === 'CUSTOMER' && (
              <Button
                variant="soft"
                className="relative h-11 w-11 rounded-full border border-gray-200 p-0 text-gray-600 hover:text-accent sm:hidden dark:border-gray-700 dark:text-gray-300"
                onClick={() => router.push('/dashboard')}
                aria-label={`Dashboard, ${appointmentCount} upcoming appointment${appointmentCount !== 1 ? 's' : ''}`}
              >
                <i className="fa-regular fa-bell text-xl" aria-hidden="true"></i>
                <NotificationBadge count={appointmentCount} />
              </Button>
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
                        <i className="fa-solid fa-user w-4 text-center" aria-hidden="true"></i>
                        <span>Dashboard</span>
                      </DropdownMenu.Item>
                    )}

                    {user.role === 'ADMIN' && activeView !== 'admin' && (
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-700 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                        onSelect={() => router.push('/admin')}
                      >
                        <i
                          className="fa-solid fa-user-shield w-4 text-center"
                          aria-hidden="true"
                        ></i>
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
                      <i
                        className="fa-solid fa-sign-out-alt w-4 text-center"
                        aria-hidden="true"
                      ></i>
                      <span>Logout</span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              onLoginClick && (
                <Button onClick={onLoginClick}>
                  <i className="fa-solid fa-sign-in-alt" aria-hidden="true"></i>
                  Sign In
                </Button>
              )
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

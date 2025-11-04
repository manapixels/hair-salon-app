'use client';

import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@radix-ui/themes';
import { cn } from '@/lib/utils';

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
          <div className="hidden items-center gap-1 sm:flex">
            <Button
              variant={activeView === 'booking' ? 'solid' : 'soft'}
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
                  variant={activeView === 'dashboard' ? 'solid' : 'soft'}
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
              <>
                <span className="hidden  text-gray-600 md:inline dark:text-gray-200">
                  Welcome, {user.name}!
                </span>
                <Button
                  variant="soft"
                  onClick={async () => {
                    await logout();
                    router.push('/');
                    toast.success('Logged out successfully');
                  }}
                >
                  Logout
                </Button>
              </>
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

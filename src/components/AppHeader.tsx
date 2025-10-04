'use client';

import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type View = 'booking' | 'admin' | 'dashboard';

interface AppHeaderProps {
  view: View;
  onViewChange: (view: View) => void;
  onLoginClick?: () => void;
}

const NavButton: React.FC<{
  href?: string;
  currentView?: View;
  targetView?: View;
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
}> = ({ href, currentView, targetView, children, onClick, isActive: isActiveProp }) => {
  const isActive = isActiveProp ?? currentView === targetView;
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </button>
  );
};

const AuthButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
}> = ({ onClick, children, primary }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      primary
        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
    }`}
  >
    {children}
  </button>
);

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
    <header className="bg-white dark:bg-gray-900 shadow-md">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <i className="fa-solid fa-scissors text-3xl text-indigo-600 mr-3"></i>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
            Luxe Cuts
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <NavButton isActive={pathname === '/'} onClick={() => router.push('/')}>
              <i className="fa-solid fa-calendar-check mr-2"></i> Book Online
            </NavButton>
            {user && user.role === 'CUSTOMER' && (
              <div className="relative">
                <NavButton
                  isActive={pathname === '/dashboard'}
                  onClick={() => router.push('/dashboard')}
                >
                  <i className="fa-solid fa-user mr-2"></i> Dashboard
                </NavButton>
                <NotificationBadge count={appointmentCount} />
              </div>
            )}
            {user?.role === 'ADMIN' && (
              <NavButton isActive={pathname === '/admin'} onClick={() => router.push('/admin')}>
                <i className="fa-solid fa-user-shield mr-2"></i> Admin
              </NavButton>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Mobile bell icon for customers */}
            {user && user.role === 'CUSTOMER' && (
              <button
                onClick={() => router.push('/dashboard')}
                className="sm:hidden relative w-11 h-11 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                aria-label={`Dashboard, ${appointmentCount} upcoming appointment${appointmentCount !== 1 ? 's' : ''}`}
              >
                <i className="fa-regular fa-bell text-xl"></i>
                <NotificationBadge count={appointmentCount} />
              </button>
            )}
            {user ? (
              <>
                <span className="text-sm font-medium hidden md:inline">Welcome, {user.name}!</span>
                <AuthButton onClick={logout}>Logout</AuthButton>
              </>
            ) : (
              <>
                {onLoginClick && (
                  <AuthButton onClick={onLoginClick} primary>
                    <i className="fa-solid fa-sign-in-alt mr-2"></i>
                    Sign In
                  </AuthButton>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

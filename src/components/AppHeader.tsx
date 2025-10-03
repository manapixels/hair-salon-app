'use client';

import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

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

export default function AppHeader({ view, onViewChange, onLoginClick }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
            <NavButton
              currentView={view}
              targetView="booking"
              onClick={() => onViewChange('booking')}
            >
              <i className="fa-solid fa-calendar-check mr-2"></i> Book Online
            </NavButton>
            {user && user.role === 'CUSTOMER' && (
              <NavButton
                isActive={pathname === '/dashboard'}
                onClick={() => router.push('/dashboard')}
              >
                <i className="fa-solid fa-user mr-2"></i> Dashboard
              </NavButton>
            )}
            {user?.role === 'ADMIN' && (
              <NavButton isActive={pathname === '/admin'} onClick={() => router.push('/admin')}>
                <i className="fa-solid fa-user-shield mr-2"></i> Admin
              </NavButton>
            )}
          </div>
          <div className="flex items-center space-x-2">
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

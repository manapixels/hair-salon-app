'use client';

import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const sessionUser = await response.json();
        setUser(sessionUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  useEffect(() => {
    checkSession();

    // Listen for auth refresh events (from OAuth redirects)
    const handleAuthRefresh = () => {
      checkSession();
    };

    window.addEventListener('auth-refresh', handleAuthRefresh);

    // Auto-refresh session every 30 minutes if user is logged in
    const sessionRefreshInterval = setInterval(
      () => {
        if (user) {
          checkSession();
        }
      },
      30 * 60 * 1000,
    ); // 30 minutes

    return () => {
      window.removeEventListener('auth-refresh', handleAuthRefresh);
      clearInterval(sessionRefreshInterval);
    };
  }, [checkSession, user]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local user state even if API call fails
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

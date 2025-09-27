import type { User } from '../types';

let activeSession: User | null = null;

const SESSION_KEY = 'luxecuts_session';

// Initialize session from localStorage on server start (for development)
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      activeSession = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load session from localStorage:', error);
  }
}

export const getSession = (): User | null => {
  // Try to get from memory first, fallback to localStorage
  if (!activeSession && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        activeSession = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load session from localStorage:', error);
    }
  }
  return activeSession;
};

export const setSession = (user: User | null): void => {
  activeSession = user;

  // Persist to localStorage for development
  if (typeof window !== 'undefined') {
    try {
      if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
    }
  }
};

export const clearSession = (): void => {
  activeSession = null;

  // Clear from localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session from localStorage:', error);
    }
  }
};

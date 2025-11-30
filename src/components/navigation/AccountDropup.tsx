'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Shield, Settings, LogOut, ChevronUp, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Avatar from '@radix-ui/react-avatar';
import { Badge } from '@/components/ui';
import { User } from '@/types';

interface AccountDropupProps {
  isOpen: boolean;
  onToggle: () => void;
  active: boolean;
  user: User | null;
  onLogout: () => void | Promise<void>;
}

export default function AccountDropup({
  isOpen,
  onToggle,
  active,
  user,
  onLogout,
}: AccountDropupProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onToggle]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onToggle]);

  const handleNavigation = (path: string) => {
    router.push(path);
    onToggle();
  };

  const handleLogoutClick = async () => {
    await onLogout();
    onToggle();
  };

  const menuItems =
    user?.role === 'ADMIN'
      ? [
          { icon: Shield, label: 'Admin Panel', onClick: () => handleNavigation('/admin') },
          { icon: Settings, label: 'Settings', onClick: () => handleNavigation('/admin/settings') },
        ]
      : [
          { icon: Calendar, label: 'My Bookings', onClick: () => handleNavigation('/dashboard') },
          {
            icon: Settings,
            label: 'Settings',
            onClick: () => handleNavigation('/dashboard/settings'),
          },
        ];

  return (
    <div ref={dropdownRef} className="relative flex items-end justify-center">
      {/* Full-Width Dropdown Menu */}
      <AnimatePresence>
        {isOpen && user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="
              absolute bottom-full left-0 right-0
              bg-white/95 backdrop-blur-xl
              border-t-2 border-[var(--accent-9)]
              shadow-[0_-4px_16px_rgba(0,0,0,0.12)]
              max-h-[calc(100vh-180px)]
              overflow-y-auto
              z-[51]
            "
            id="account-dropdown"
            role="menu"
            aria-label="Account options"
          >
            {/* User Header */}
            <div className="px-6 py-4 bg-[var(--accent-2)] border-b border-[var(--accent-4)]">
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
                  <p className="text-base font-semibold text-[var(--gray-12)]">{user.name}</p>
                  {user.email && (
                    <p className="text-xs text-[var(--gray-11)] mt-0.5">{user.email}</p>
                  )}
                  <Badge className="mt-1 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    {user.role === 'ADMIN' ? 'Admin' : 'Customer'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    onClick={item.onClick}
                    className="
                      w-full flex items-center gap-4 px-6 py-4
                      text-[var(--gray-12)]
                      hover:bg-gray-100
                      transition-colors duration-200
                      border-b border-gray-100 last:border-0
                      touch-target
                    "
                    role="menuitem"
                  >
                    <Icon className="w-5 h-5 text-[var(--gray-11)]" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Logout Button */}
            <div className="border-t border-gray-200">
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: menuItems.length * 0.05, duration: 0.2 }}
                onClick={handleLogoutClick}
                className="
                  w-full flex items-center gap-4 px-6 py-4
                  text-red-600
                  hover:bg-red-50
                  transition-colors duration-200
                  touch-target
                "
                role="menuitem"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-semibold">Logout</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Region for Screen Readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {isOpen ? 'Account menu opened' : ''}
      </div>

      {/* Trigger Button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onToggle}
        className={`
          flex flex-col items-center justify-center
          min-w-[56px] min-h-[56px]
          px-3 py-2
          relative
          transition-all duration-300 ease-out
          ${
            active || isOpen
              ? 'text-[var(--accent-11)]'
              : 'text-[var(--gray-10)] hover:text-[var(--gray-12)]'
          }
        `}
        aria-label="Account menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="account-dropdown"
      >
        <div
          className={`
          relative
          transition-all duration-300 ease-out
          ${active || isOpen ? 'scale-110' : 'scale-100'}
        `}
        >
          {user?.role === 'ADMIN' ? (
            <Shield
              className={`w-6 h-6 transition-all duration-300 ${active || isOpen ? 'stroke-[2.5]' : 'stroke-2'}`}
            />
          ) : (
            <UserIcon
              className={`w-6 h-6 transition-all duration-300 ${active || isOpen ? 'stroke-[2.5]' : 'stroke-2'}`}
            />
          )}

          {/* Chevron Indicator */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute -bottom-0.5 right-0"
          >
            <ChevronUp className="w-3 h-3" />
          </motion.div>

          {active && !isOpen && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent-9)]"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </div>

        <span
          className={`text-[10px] mt-1 transition-all duration-300 ${active || isOpen ? 'font-semibold' : 'font-medium'}`}
        >
          {user?.role === 'ADMIN' ? 'Admin' : 'Account'}
        </span>
      </motion.button>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { LucideIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomNavItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  href?: string;
  onClick?: () => void;
  badge?: number;
  variant?: 'default' | 'primary';
  className?: string;
  isOpen?: boolean;
  isAdmin?: boolean;
}

export default function BottomNavItem({
  icon: Icon,
  label,
  active,
  href,
  onClick,
  badge,
  variant = 'default',
  className = '',
  isOpen = false,
  isAdmin = false,
}: BottomNavItemProps) {
  const isPrimary = variant === 'primary';

  const content = (
    <motion.button
      whileTap={{ scale: 0.92 }}
      className={`
        flex flex-col items-center justify-center
        ${isPrimary ? 'w-14 h-14 rounded-full bg-accent text-white -mt-8 border-4 border-white' : 'min-w-[56px] min-h-[56px] px-3 py-2 text-gray-500 hover:text-foreground'}
        relative
        transition-all duration-300 ease-out
        ${!isPrimary && (active || isOpen) ? 'text-accent-foreground' : ''}
        ${className}
      `}
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      {/* Admin Badge */}

      {/* Icon Container */}
      <div
        className={`
        relative flex items-center justify-center
        transition-all duration-300 ease-out
        ${(active || isOpen) && !isPrimary ? 'bg-accent/10 rounded-full px-5 py-1' : 'px-0 py-0'}
      `}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6 stroke-2" />
            </motion.div>
          ) : (
            <motion.div
              key="main-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Icon
                className={`
                  transition-all duration-300
                  ${isPrimary ? 'w-6 h-6 stroke-2' : 'w-6 h-6'}
                  ${!isPrimary && active ? 'stroke-[2.5]' : 'stroke-2'}
                `}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge */}
        {badge && badge > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold"
            aria-label={`${badge} unread ${badge === 1 ? 'notification' : 'notifications'}`}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>

      {/* Label (Hide for primary if desired, or keep small) */}
      {/* Label or Admin Badge */}
      {!isPrimary && (
        <div className="mt-1 flex items-center justify-center h-[16px]">
          {isAdmin ? (
            <span className="bg-gray-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              Admin
            </span>
          ) : (
            <span
              className={`
              text-xs
              transition-all duration-300
              ${active ? 'font-semibold' : 'font-medium'}
            `}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </motion.button>
  );

  return href ? (
    <Link href={href} className="no-tap-highlight flex flex-col justify-center items-center">
      {content}
      {isPrimary && (
        <span
          className={`
          text-xs
          transition-all duration-300
          ${active ? 'font-semibold' : 'font-medium'}
        `}
        >
          {label}
        </span>
      )}
    </Link>
  ) : (
    content
  );
}

'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  href?: string;
  onClick?: () => void;
  badge?: number;
  variant?: 'default' | 'primary';
  className?: string;
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
}: BottomNavItemProps) {
  const isPrimary = variant === 'primary';

  const content = (
    <motion.button
      whileTap={{ scale: 0.92 }}
      className={`
        flex flex-col items-center justify-center
        ${isPrimary ? 'w-14 h-14 rounded-full bg-[var(--accent-9)] text-white -mt-8 border-4 border-white dark:border-gray-900' : 'min-w-[56px] min-h-[56px] px-3 py-2 text-[var(--gray-10)] hover:text-[var(--gray-12)]'}
        relative
        transition-all duration-300 ease-out
        ${!isPrimary && active ? 'text-base-primary' : ''}
        ${className}
      `}
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      {/* Icon Container */}
      <div
        className={`
        relative flex items-center justify-center
        transition-all duration-300 ease-out
        ${active && !isPrimary ? 'bg-base-primary/10 rounded-full px-5 py-1' : 'px-0 py-0'}
      `}
      >
        <Icon
          className={`
            transition-all duration-300
            ${isPrimary ? 'w-6 h-6 stroke-2' : 'w-6 h-6'}
            ${!isPrimary && active ? 'stroke-[2.5]' : 'stroke-2'}
          `}
        />

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
      {!isPrimary && (
        <span
          className={`
          text-xs mt-1
          transition-all duration-300
          ${active ? 'font-semibold' : 'font-medium'}
        `}
        >
          {label}
        </span>
      )}
    </motion.button>
  );

  return href ? (
    <Link href={href} className="no-tap-highlight flex justify-center">
      {content}
    </Link>
  ) : (
    content
  );
}

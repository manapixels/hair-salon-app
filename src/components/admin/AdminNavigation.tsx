'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Calendar,
  Clock,
  Users,
  UserCircle,
  MessageSquare,
  BookOpen,
  Settings,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { isStylist } from '@/lib/roleHelpers';

export type AdminSection =
  | 'home'
  | 'my-profile'
  | 'appointments'
  | 'availability'
  | 'stylists'
  | 'customers'
  | 'chat'
  | 'knowledge-base'
  | 'settings';

interface NavigationItem {
  id: AdminSection;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface NavigationGroup {
  label?: string;
  items: NavigationItem[];
}

interface AdminNavigationProps {
  className?: string;
  onNavigate?: () => void; // For mobile: close menu on navigate
  badges?: {
    appointments?: number;
    chat?: number;
  };
}

export default function AdminNavigation({
  className,
  onNavigate,
  badges = {},
}: AdminNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const t = useTranslations('AdminNavigation');
  const basePath = `/${locale}/admin`;

  const navigationGroups: NavigationGroup[] = [
    {
      // Dashboard - standalone, no group label
      items: [
        {
          id: 'home',
          label: t('items.dashboard'),
          icon: <LayoutDashboard className="w-5 h-5" />,
          href: basePath,
        },
      ],
    },
    {
      label: t('sections.customers'),
      items: [
        {
          id: 'appointments',
          label: t('items.appointments'),
          icon: <Calendar className="w-5 h-5" />,
          href: `${basePath}/appointments`,
          badge: badges.appointments,
        },
        {
          id: 'customers',
          label: t('items.customers'),
          icon: <UserCircle className="w-5 h-5" />,
          href: `${basePath}/customers`,
        },
        {
          id: 'chat',
          label: t('items.flaggedChats'),
          icon: <MessageSquare className="w-5 h-5" />,
          href: `${basePath}/chat`,
          badge: badges.chat,
        },
      ],
    },
    {
      label: t('sections.manageSalon'),
      items: [
        {
          id: 'stylists',
          label: t('items.stylists'),
          icon: <Users className="w-5 h-5" />,
          href: `${basePath}/stylists`,
        },
        {
          id: 'availability',
          label: t('items.availability'),
          icon: <Clock className="w-5 h-5" />,
          href: `${basePath}/availability`,
        },
        {
          id: 'settings',
          label: t('items.salonInfo'),
          icon: <Settings className="w-5 h-5" />,
          href: `${basePath}/settings`,
        },
        {
          id: 'knowledge-base',
          label: t('items.knowledgeBase'),
          icon: <BookOpen className="w-5 h-5" />,
          href: `${basePath}/knowledge-base`,
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === basePath) {
      return pathname === basePath;
    }
    return pathname.startsWith(href);
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  return (
    <nav className={cn('space-y-6', className)}>
      {navigationGroups.map((group, index) => (
        <div key={`nav-group-${index}`}>
          {group.label && (
            <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label}
            </h3>
          )}
          <ul className="space-y-1">
            {group.items.map(item => {
              const active = isActive(item.href);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigate(item.href)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all',
                      'hover:bg-muted active:scale-[0.98]',
                      active ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn(active ? 'text-primary' : 'text-muted-foreground')}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {item.badge && item.badge > 0 && (
                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium bg-primary text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={cn(
                          'w-4 h-4 lg:hidden',
                          active ? 'text-primary' : 'text-muted-foreground/50',
                        )}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  BookOpen,
  Building2,
  CalendarClock,
  XCircle,
  Scissors,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminSection =
  | 'home'
  | 'appointments'
  | 'availability'
  | 'stylists'
  | 'chat'
  | 'knowledge-base'
  | 'settings-business'
  | 'settings-hours'
  | 'settings-closures'
  | 'settings-services';

interface NavigationItem {
  id: AdminSection;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface NavigationGroup {
  label: string;
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

  const basePath = `/${locale}/admin`;

  const navigationGroups: NavigationGroup[] = [
    {
      label: 'Quick Glance',
      items: [
        {
          id: 'home',
          label: 'Dashboard',
          icon: <LayoutDashboard className="w-5 h-5" />,
          href: basePath,
        },
      ],
    },
    {
      label: 'Bookings',
      items: [
        {
          id: 'appointments',
          label: 'Appointments',
          icon: <Calendar className="w-5 h-5" />,
          href: `${basePath}/appointments`,
          badge: badges.appointments,
        },
        {
          id: 'availability',
          label: 'Availability',
          icon: <Clock className="w-5 h-5" />,
          href: `${basePath}/availability`,
        },
      ],
    },
    {
      label: 'Team',
      items: [
        {
          id: 'stylists',
          label: 'Stylists',
          icon: <Users className="w-5 h-5" />,
          href: `${basePath}/stylists`,
        },
      ],
    },
    {
      label: 'Support',
      items: [
        {
          id: 'chat',
          label: 'Chat Management',
          icon: <MessageSquare className="w-5 h-5" />,
          href: `${basePath}/chat`,
          badge: badges.chat,
        },
        {
          id: 'knowledge-base',
          label: 'Knowledge Base',
          icon: <BookOpen className="w-5 h-5" />,
          href: `${basePath}/knowledge-base`,
        },
      ],
    },
    {
      label: 'Settings',
      items: [
        {
          id: 'settings-business',
          label: 'Business Info',
          icon: <Building2 className="w-5 h-5" />,
          href: `${basePath}/settings/business`,
        },
        {
          id: 'settings-hours',
          label: 'Operating Hours',
          icon: <CalendarClock className="w-5 h-5" />,
          href: `${basePath}/settings/hours`,
        },
        {
          id: 'settings-closures',
          label: 'Closures',
          icon: <XCircle className="w-5 h-5" />,
          href: `${basePath}/settings/closures`,
        },
        {
          id: 'settings-services',
          label: 'Services & Pricing',
          icon: <Scissors className="w-5 h-5" />,
          href: `${basePath}/settings/services`,
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
      {navigationGroups.map(group => (
        <div key={group.label}>
          <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {group.label}
          </h3>
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

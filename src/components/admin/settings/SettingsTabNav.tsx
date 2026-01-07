'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Building2, CalendarClock, XCircle, Scissors, Shield, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'business', label: 'Business', icon: Building2, href: 'business' },
  { id: 'schedule', label: 'Schedule', icon: CalendarClock, href: 'schedule' },
  { id: 'closures', label: 'Closures', icon: XCircle, href: 'closures' },
  { id: 'services', label: 'Services', icon: Scissors, href: 'services' },
  { id: 'deposits', label: 'Deposits', icon: Shield, href: 'deposits' },
  { id: 'social', label: 'Social', icon: Link2, href: 'social' },
];

export default function SettingsTabNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const basePath = `/${locale}/admin/settings`;

  // Determine active tab from pathname
  const activeTab = tabs.find(tab => pathname.includes(`/settings/${tab.href}`))?.id || 'business';

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={`${basePath}/${tab.href}`}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors',
              isActive
                ? 'bg-primary/10 text-primary border-primary/20 font-medium'
                : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

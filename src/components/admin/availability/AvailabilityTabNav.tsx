'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Users, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'stylists', label: 'Stylist Availability', icon: Users, href: 'stylists' },
  { id: 'hours', label: 'Business Hours', icon: Clock, href: 'hours' },
  { id: 'closures', label: 'Special Closures', icon: XCircle, href: 'closures' },
];

export default function AvailabilityTabNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const basePath = `/${locale}/admin/availability`;

  // Determine active tab from pathname
  const activeTab =
    tabs.find(tab => pathname.includes(`/availability/${tab.href}`))?.id || 'stylists';

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

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Building2, Scissors, Shield, Link2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsTabNav() {
  const t = useTranslations('Admin.Settings.Nav');
  const pathname = usePathname();
  const locale = useLocale();
  const basePath = `/${locale}/admin/settings`;

  const tabs = [
    { id: 'business', label: t('business'), icon: Building2, href: 'business' },
    { id: 'hours', label: t('hours'), icon: Clock, href: 'hours' },
    { id: 'closures', label: t('closures'), icon: XCircle, href: 'closures' },
    { id: 'services', label: t('services'), icon: Scissors, href: 'services' },
    { id: 'deposits', label: t('deposits'), icon: Shield, href: 'deposits' },
    { id: 'social', label: t('social'), icon: Link2, href: 'social' },
  ];

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

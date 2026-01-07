'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Menu, X, ChevronLeft } from 'lucide-react';
import AdminNavigation from './AdminNavigation';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  headerAction?: React.ReactNode;
  showBackButton?: boolean;
  badges?: {
    appointments?: number;
    chat?: number;
  };
}

export default function AdminLayout({
  children,
  title,
  headerAction,
  showBackButton = false,
  badges = {},
}: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();

  const t = useTranslations('Admin.Navigation');

  const basePath = `/${locale}/admin`;
  const isHomePage = pathname === basePath;

  // Derive title from pathname if not provided
  const derivedTitle = title || getTitleFromPath(pathname, basePath, t);

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          {showBackButton && !isHomePage ? (
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>{t('back')}</span>
            </button>
          ) : (
            <h1 className="text-lg font-semibold text-foreground">{derivedTitle}</h1>
          )}

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />

          {/* Slide-in Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-background shadow-xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 h-14 border-b border-border">
              <h2 className="font-semibold">{t('menu')}</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">
              <AdminNavigation badges={badges} onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="lg:flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-border bg-background shrink-0">
          <div className="sticky top-20 p-6">
            <AdminNavigation badges={badges} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Desktop Header */}
          <header className="hidden lg:block sticky top-0 z-30 bg-muted/80 backdrop-blur-sm border-b border-border">
            <div className="px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-serif font-light text-foreground">{derivedTitle}</h2>
              {headerAction && <div>{headerAction}</div>}
            </div>
          </header>

          {/* Content Area */}
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function getTitleFromPath(pathname: string, basePath: string, t: any): string {
  const segment = pathname.replace(basePath, '').split('/').filter(Boolean)[0];

  const titles: Record<string, string> = {
    '': t('dashboard'),
    appointments: t('appointments'),
    availability: t('availability'),
    stylists: t('stylists'),
    chat: t('chat'),
    'knowledge-base': t('knowledgeBase'),
    settings: t('settings'),
  };

  return titles[segment || ''] || 'Admin';
}

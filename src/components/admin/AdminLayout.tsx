'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Menu, X, ChevronLeft } from 'lucide-react';
import AdminNavigation from './AdminNavigation';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  badges?: {
    appointments?: number;
    chat?: number;
  };
}

export default function AdminLayout({
  children,
  title,
  showBackButton = false,
  badges = {},
}: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();

  const basePath = `/${locale}/admin`;
  const isHomePage = pathname === basePath;

  // Derive title from pathname if not provided
  const derivedTitle = title || getTitleFromPath(pathname, basePath);

  return (
    <div className="min-h-screen bg-muted">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          {showBackButton && !isHomePage ? (
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
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
              <h2 className="font-semibold">Menu</h2>
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
      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 fixed left-0 top-0 bottom-0 bg-background border-r border-border overflow-y-auto">
          <div className="p-6">
            <h1 className="text-xl font-serif font-light text-foreground mb-6">Admin Dashboard</h1>
            <AdminNavigation badges={badges} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:ml-64 flex-1 min-h-screen">
          {/* Desktop Header */}
          <header className="hidden lg:block sticky top-0 z-30 bg-muted/80 backdrop-blur-sm border-b border-border">
            <div className="px-6 py-4">
              <h2 className="text-2xl font-serif font-light text-foreground">{derivedTitle}</h2>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function getTitleFromPath(pathname: string, basePath: string): string {
  const segment = pathname.replace(basePath, '').split('/').filter(Boolean)[0];

  const titles: Record<string, string> = {
    '': 'Dashboard',
    appointments: 'Appointments',
    availability: 'Availability',
    stylists: 'Stylists',
    chat: 'Chat Management',
    'knowledge-base': 'Knowledge Base',
    settings: 'Settings',
  };

  return titles[segment || ''] || 'Admin';
}

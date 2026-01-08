'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  User,
  Edit,
  Delete,
  Calendar as CalendarIcon,
  Clock,
  WhatsAppIcon,
  TelegramIcon,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Stylist, ServiceCategory } from '@/types';
import StylistForm from './StylistForm';
import ManageBlockedDates from './ManageBlockedDates';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface StylistSmartGridViewProps {
  stylists: Stylist[];
  availableCategories: ServiceCategory[];
  fetchStylists: () => Promise<void>;
  onDelete: (id: string) => void;
}

export default function StylistSmartGridView({
  stylists,
  availableCategories,
  fetchStylists,
  onDelete,
}: StylistSmartGridViewProps) {
  const t = useTranslations('Admin.Stylists');
  const tNav = useTranslations('Navigation');
  const tCommon = useTranslations('Common');
  const tAvail = useTranslations('Admin.Availability');

  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null);
  const [availabilityStylist, setAvailabilityStylist] = useState<Stylist | null>(null);

  const daysOfWeek = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ] as const;

  // Helper to render contact badge (WhatsApp/Telegram/Email)
  const renderContactBadge = (email: string | undefined) => {
    if (!email) return null;

    if (email.endsWith('@whatsapp.local')) {
      const phone = email.split('@')[0];
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
          <WhatsAppIcon className="w-3 h-3" />
          {phone}
        </span>
      );
    }

    if (email.endsWith('@telegram.local')) {
      const username = email.split('@')[0];
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
          <TelegramIcon className="w-3 h-3" />@{username}
        </span>
      );
    }

    return <p className="text-xs text-gray-500">{email}</p>;
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stylists.map(stylist => (
          <div
            key={stylist.id}
            className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                {stylist.avatar ? (
                  <Image
                    src={stylist.avatar}
                    alt={stylist.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full mr-3 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{stylist.name}</h3>
                  {renderContactBadge(stylist.email)}
                </div>
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-primary"
                  onClick={() => setEditingStylist(stylist)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-red-600"
                  onClick={() => onDelete(stylist.id)}
                >
                  <Delete className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {stylist.bio && (
              <p className="text-sm text-gray-700 mb-3 line-clamp-2">{stylist.bio}</p>
            )}

            <div className="mb-4 flex-1">
              <div className="flex flex-wrap gap-1">
                {stylist.specialties.map(category => (
                  <span
                    key={category.id}
                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                  >
                    {category.slug
                      ? tNav(`serviceNames.${category.slug}` as any) || category.title
                      : category.title}
                  </span>
                ))}
              </div>
            </div>

            {/* Mini-Week Viz */}
            <div className="mb-4">
              <div className="flex justify-between items-end gap-1">
                {daysOfWeek.map(day => {
                  const isWorking = stylist.workingHours[day]?.isWorking;
                  const dayLabel = tCommon(`days.${day}`).slice(0, 1);
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-sm ${isWorking ? 'bg-primary/60 h-6' : 'bg-gray-200 h-1'}`}
                        title={`${day}: ${isWorking ? 'Working' : 'Off'}`}
                      ></div>
                      <span className="text-[10px] text-gray-400 uppercase">{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" onClick={() => setEditingStylist(stylist)}>
                {t('editStylist')}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={() => setAvailabilityStylist(stylist)}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {tAvail('blockedDates')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={!!editingStylist} onOpenChange={open => !open && setEditingStylist(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editStylist')}</DialogTitle>
          </DialogHeader>
          <StylistForm
            stylist={editingStylist}
            availableCategories={availableCategories}
            onSave={() => {
              fetchStylists();
              setEditingStylist(null);
            }}
            onCancel={() => setEditingStylist(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog
        open={!!availabilityStylist}
        onOpenChange={open => !open && setAvailabilityStylist(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <VisuallyHidden>
            <DialogTitle>{tAvail('blockedDates')}</DialogTitle>
            <DialogDescription>{tAvail('blockedDatesDesc')}</DialogDescription>
          </VisuallyHidden>
          {availabilityStylist && <ManageBlockedDates stylistId={availabilityStylist.id} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

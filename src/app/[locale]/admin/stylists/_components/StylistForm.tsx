'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { User, Plus } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Stylist, ServiceCategory, AdminSettings } from '@/types';

interface StylistFormProps {
  stylist?: Stylist | null;
  availableCategories: ServiceCategory[];
  onSave: () => void;
  onCancel?: () => void;
  onAvatarChange?: (avatarUrl: string) => void;
}

export default function StylistForm({
  stylist,
  availableCategories,
  onSave,
  onCancel,
  onAvatarChange,
}: StylistFormProps) {
  const t = useTranslations('Admin.Stylists');
  const tNav = useTranslations('Navigation');
  const tCommon = useTranslations('Common');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: '',
    specialtyCategoryIds: [] as string[],
    workingHours: getDefaultWorkingHours(),
    blockedDates: [] as string[],
    userId: '' as string,
  });

  // User search state (for promoting existing users)
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [salonSettings, setSalonSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Time options for dropdowns
  const timeOptions = useMemo(() => {
    const times: string[] = [];
    for (let h = 6; h <= 22; h++) {
      times.push(`${h.toString().padStart(2, '0')}:00`);
      times.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return times;
  }, []);

  const daysOfWeek = useMemo(
    () => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const,
    [],
  );

  const fetchSalonSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = (await response.json()) as AdminSettings;
        setSalonSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch salon settings:', err);
    }
  }, []);

  useEffect(() => {
    if (!salonSettings) {
      fetchSalonSettings();
    }
  }, [salonSettings, fetchSalonSettings]);

  const getWorkingHoursFromSalonSettings = useCallback((): Stylist['workingHours'] => {
    if (!salonSettings?.weeklySchedule) {
      return getDefaultWorkingHours();
    }
    const workingHours: Stylist['workingHours'] = {};
    for (const day of daysOfWeek) {
      const salonDay = salonSettings.weeklySchedule[day];
      if (salonDay) {
        workingHours[day] = {
          start: salonDay.openingTime || '09:00',
          end: salonDay.closingTime || '17:00',
          isWorking: salonDay.isOpen ?? true,
        };
      } else {
        workingHours[day] = { start: '09:00', end: '17:00', isWorking: true };
      }
    }
    return workingHours;
  }, [salonSettings, daysOfWeek]);

  // Track if we've initialized the form for the current stylist
  const [formInitialized, setFormInitialized] = useState(false);

  useEffect(() => {
    if (stylist) {
      setFormData({
        name: stylist.name,
        email: stylist.email || '',
        bio: stylist.bio || '',
        avatar: stylist.avatar || '',
        specialtyCategoryIds: stylist.specialties.map(cat => cat.id),
        workingHours: stylist.workingHours,
        blockedDates: [],
        userId: '',
      });
      setSelectedUser(null);
      setUserSearchQuery('');
      setUserSearchResults([]);
      setFormInitialized(true);
    } else {
      setFormInitialized(false);
    }
    setError('');
  }, [stylist]);

  useEffect(() => {
    if (!stylist && !formInitialized) {
      setFormData({
        name: '',
        email: '',
        bio: '',
        avatar: '',
        specialtyCategoryIds: [],
        workingHours: getWorkingHoursFromSalonSettings(),
        blockedDates: [],
        userId: '',
      });
      setSelectedUser(null);
      setUserSearchQuery('');
      setUserSearchResults([]);
    }
  }, [stylist, formInitialized, getWorkingHoursFromSalonSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || formData.specialtyCategoryIds.length === 0) {
      const errorMsg = t('requiredFields');
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);
    const action = stylist ? t('updating') : t('creating');
    const toastId = toast.loading(action);

    try {
      const url = stylist ? `/api/stylists/${stylist.id}` : '/api/stylists';
      const method = stylist ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        throw new Error(errorData.message || t('saveFailed'));
      }

      const successMsg = stylist ? t('updateSuccess') : t('createSuccess');
      toast.success(successMsg, { id: toastId });
      onSave();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('saveFailed');
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      specialtyCategoryIds: prev.specialtyCategoryIds.includes(categoryId)
        ? prev.specialtyCategoryIds.filter(id => id !== categoryId)
        : [...prev.specialtyCategoryIds, categoryId],
    }));
  };

  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query);
    if (query.length < 2) {
      setUserSearchResults([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const response = await fetch(
        `/api/admin/users/search?q=${encodeURIComponent(query)}&excludeStylists=true`,
      );
      if (response.ok) {
        const users = (await response.json()) as any[];
        setUserSearchResults(users);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setFormData(prev => ({
      ...prev,
      name: user.name,
      email: user.email || '',
      avatar: user.avatar || prev.avatar,
      userId: user.id,
    }));
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleClearSelectedUser = () => {
    setSelectedUser(null);
    setFormData(prev => ({
      ...prev,
      name: '',
      email: '',
      userId: '',
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('invalidFileType'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('fileTooLarge'));
      return;
    }

    setIsUploadingAvatar(true);
    const uploadToast = toast.loading(t('uploadingAvatar'));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        throw new Error(errorData.message || t('avatarUploadFailed'));
      }

      const data = (await response.json()) as { url: string };
      setFormData(prev => ({ ...prev, avatar: data.url }));

      if (onAvatarChange) {
        onAvatarChange(data.url);
      }

      if (stylist) {
        const saveResponse = await fetch(`/api/stylists/${stylist.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: data.url }),
        });
        if (!saveResponse.ok) console.error('Failed to save avatar to database');
      }

      toast.success(t('avatarUploadSuccess'), { id: uploadToast });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('avatarUploadFailed');
      toast.error(errorMsg, { id: uploadToast });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const updateWorkingHours = (
    day: string,
    field: 'start' | 'end' | 'isWorking',
    value: string | boolean,
  ) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value,
        },
      },
    }));
  };

  function getDefaultWorkingHours(): Stylist['workingHours'] {
    return {
      monday: { start: '11:00', end: '19:00', isWorking: true },
      tuesday: { start: '11:00', end: '19:00', isWorking: false },
      wednesday: { start: '11:00', end: '19:00', isWorking: true },
      thursday: { start: '11:00', end: '19:00', isWorking: true },
      friday: { start: '11:00', end: '19:00', isWorking: true },
      saturday: { start: '11:00', end: '19:00', isWorking: true },
      sunday: { start: '11:00', end: '19:00', isWorking: true },
    };
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded break-words overflow-hidden max-w-full">
          {error}
        </div>
      )}

      {/* User Selection (only for new stylists) */}
      {!stylist && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {t('selectUserPromote')} *
          </label>
          <p className="text-xs text-gray-500 mb-3">{t('selectUserPromoteDesc')}</p>

          {selectedUser ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {selectedUser.avatar ? (
                    <Image
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedUser.whatsappPhone || selectedUser.email || t('telegramUser')}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSelectedUser}
                className="text-red-600 hover:text-red-700"
              >
                {t('change')}
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Input
                type="text"
                value={userSearchQuery}
                onChange={e => handleUserSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full"
              />
              {isSearchingUsers && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg
                    className="animate-spin h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                  </svg>
                </div>
              )}

              {userSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {userSearchResults.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user.name}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.whatsappPhone || user.email || t('telegramUser')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {userSearchQuery.length >= 2 &&
                !isSearchingUsers &&
                userSearchResults.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {t('noUsersFound', { query: userSearchQuery })}
                  </p>
                )}
            </div>
          )}
        </div>
      )}

      <div>
        <Label>{t('displayName')} *</Label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, name: e.target.value }))
          }
          placeholder={selectedUser ? t('autoFilled') : t('displayNamePlaceholder')}
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-shrink-0">
          <Label className="block mb-2">{t('avatarPhoto')}</Label>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gray-200 mb-3 overflow-hidden relative border border-gray-300">
              {formData.avatar ? (
                <Image src={formData.avatar} alt={formData.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? t('uploadingPhoto') : t('uploadPhoto')}
            </Button>
            {formData.avatar && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 text-xs mt-1 hover:text-red-700 h-auto py-1"
                onClick={() => {
                  setFormData(prev => ({ ...prev, avatar: '' }));
                  if (onAvatarChange) onAvatarChange('');
                }}
              >
                {t('remove')}
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <Label>{t('bio')}</Label>
            <Textarea
              value={formData.bio}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData(prev => ({ ...prev, bio: e.target.value }))
              }
              placeholder={t('bioPlaceholder')}
              rows={4}
            />
          </div>

          <div>
            <Label>{t('specialtiesLabel')}</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {availableCategories.map(category => (
                <div key={category.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`cat-${category.id}`}
                    checked={formData.specialtyCategoryIds.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`cat-${category.id}`}
                    className="text-sm text-gray-900 cursor-pointer"
                  >
                    {category.slug
                      ? tNav(`serviceNames.${category.slug}` as any) || category.title
                      : category.title}
                  </label>
                </div>
              ))}
            </div>
            <div className="flex space-x-2 mt-2">
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    specialtyCategoryIds: availableCategories.map(c => c.id),
                  }))
                }
              >
                {t('selectAll')}
              </button>
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
                onClick={() => setFormData(prev => ({ ...prev, specialtyCategoryIds: [] }))}
              >
                {t('deselectAll')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-base">{t('workingHours')}</Label>
          <span className="text-xs text-gray-500">{t('workingHoursDesc')}</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          {daysOfWeek.map(day => (
            <div key={day} className="flex items-center gap-2 text-sm">
              <div className="w-24 font-medium capitalize">{tCommon(`days.${day}`)}</div>
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.workingHours[day]?.isWorking ?? false}
                    onChange={e => updateWorkingHours(day, 'isWorking', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {formData.workingHours[day]?.isWorking ? (
                <>
                  <select
                    value={formData.workingHours[day]?.start}
                    onChange={e => updateWorkingHours(day, 'start', e.target.value)}
                    className="text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary px-2 py-1"
                  >
                    {timeOptions.map(t => (
                      <option key={`start-${day}-${t}`} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="px-1 text-gray-500">{t('to')}</span>
                  <select
                    value={formData.workingHours[day]?.end}
                    onChange={e => updateWorkingHours(day, 'end', e.target.value)}
                    className="text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary px-2 py-1"
                  >
                    {timeOptions.map(t => (
                      <option key={`end-${day}-${t}`} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <span className="text-gray-400 italic px-2">{t('dayOff')}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('cancel')}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 min-w-[100px]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
              <span>{t('saving')}</span>
            </div>
          ) : stylist ? (
            t('updateStylist')
          ) : (
            t('createStylist')
          )}
        </Button>
      </div>
    </form>
  );
}

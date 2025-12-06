'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { Stylist, ServiceCategory, AdminSettings } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { useTranslations } from 'next-intl';
import { Plus, User, Edit, Delete, Clock } from '@/lib/icons';

interface StylistManagementProps {
  onClose?: () => void;
}

export default function StylistManagement({ onClose }: StylistManagementProps) {
  const t = useTranslations('Admin.Stylists');
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [availableCategories, setAvailableCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null);

  // AlertDialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stylistToDeleteId, setStylistToDeleteId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      // Get just the category info (without items) for specialty selection
      const categories = data.map((cat: ServiceCategory) => ({
        id: cat.id,
        slug: cat.slug,
        title: cat.title,
        shortTitle: cat.shortTitle,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        items: [], // Don't need items for specialty selection
      }));
      setAvailableCategories(categories);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  const fetchStylists = useCallback(async () => {
    try {
      const response = await fetch('/api/stylists');
      if (!response.ok) {
        throw new Error(t('loadFailed'));
      }

      const data = await response.json();

      // Validate response is an array
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      setStylists(data);
    } catch (error) {
      console.error('Failed to fetch stylists:', error);
      toast.error(t('loadFailed'));
      setStylists([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStylists();
    fetchCategories();
  }, [fetchStylists, fetchCategories]);

  const handleDeleteStylist = (stylistId: string) => {
    setStylistToDeleteId(stylistId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteStylist = async () => {
    if (!stylistToDeleteId) return;

    const toastId = toast.loading(t('deleting'));
    try {
      const response = await fetch(`/api/stylists/${stylistToDeleteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchStylists();
        toast.success(t('deleteSuccess'), { id: toastId });
      } else {
        toast.error(t('deleteFailed'), { id: toastId });
      }
    } catch (error) {
      toast.error(t('deleteFailed'), { id: toastId });
      console.error('Error deleting stylist:', error);
    } finally {
      setDeleteDialogOpen(false);
      setStylistToDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" message={t('loading')} />
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex justify-end items-center mb-6">
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 sm:mr-2" aria-hidden="true" />
              <span>{t('addStylist')}</span>
            </button>
          </div>
        </div>

        {stylists.length === 0 ? (
          <div className="bg-white p-8 rounded-lg text-center">
            <div className="relative w-48 h-48 mx-auto mb-4">
              <Image
                src="/images/illustrations/stylist-team-empty.png"
                alt={t('noStylistsYet')}
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noStylistsYet')}</h3>
            <p className="text-gray-600 mb-4">{t('noStylistsDesc')}</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              {t('addFirstStylist')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stylists.map(stylist => (
              <div key={stylist.id} className="bg-white p-4 rounded-lg border border-gray-200">
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
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-3"></div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{stylist.name}</h3>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingStylist(stylist)}
                      className="text-yellow-600 hover:text-yellow-700"
                      title={t('editStylist')}
                      aria-label={t('editStylist')}
                    >
                      <Edit className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDeleteStylist(stylist.id)}
                      className="text-red-600 hover:text-red-700"
                      title={t('deleteStylist')}
                      aria-label={t('deleteStylist')}
                    >
                      <Delete className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {stylist.bio && <p className="text-sm text-gray-700 mb-3">{stylist.bio}</p>}

                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{t('specialties')}</h4>
                  <div className="flex flex-wrap gap-1">
                    {stylist.specialties.map(category => (
                      <span
                        key={category.id}
                        className="inline-block bg-primary-100 text-yellow-800 text-xs px-2 py-1 rounded"
                      >
                        {category.title}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  <div className="grid grid-cols-2 grid-rows-4 grid-flow-col gap-x-4 gap-y-1">
                    {(
                      [
                        'monday',
                        'tuesday',
                        'wednesday',
                        'thursday',
                        'friday',
                        'saturday',
                        'sunday',
                      ] as const
                    ).map(day => {
                      const hours = stylist.workingHours[day];
                      return (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize font-medium">{day.slice(0, 3)}:</span>
                          <span>{hours.isWorking ? `${hours.start}-${hours.end}` : t('off')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Stylist Modal */}
        <StylistModal
          isOpen={showAddModal || !!editingStylist}
          onClose={() => {
            setShowAddModal(false);
            setEditingStylist(null);
          }}
          stylist={editingStylist}
          availableCategories={availableCategories}
          onSave={async () => {
            await fetchStylists();
            setShowAddModal(false);
            setEditingStylist(null);
          }}
          onAvatarChange={avatarUrl => {
            // Update the stylist card immediately when avatar is uploaded
            if (editingStylist) {
              setStylists(prev =>
                prev.map(s => (s.id === editingStylist.id ? { ...s, avatar: avatarUrl } : s)),
              );
              setEditingStylist(prev => (prev ? { ...prev, avatar: avatarUrl } : null));
            }
          }}
        />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('deleteDialogTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteDialogDesc')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('no')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStylist}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('yesDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface StylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  stylist: Stylist | null;
  availableCategories: ServiceCategory[];
  onSave: () => void;
  onAvatarChange?: (avatarUrl: string) => void;
}

function StylistModal({
  isOpen,
  onClose,
  stylist,
  availableCategories,
  onSave,
  onAvatarChange,
}: StylistModalProps) {
  const t = useTranslations('Admin.Stylists');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: '',
    specialtyCategoryIds: [] as string[],
    workingHours: getDefaultWorkingHours(),
    blockedDates: [] as string[], // Keep for API compatibility, but not editable here
    userId: '' as string, // Link to User account for promoted users
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

  // Days of week for working hours - stable reference
  const daysOfWeek = useMemo(
    () => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const,
    [],
  );

  // Fetch salon settings to use as default working hours
  const fetchSalonSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSalonSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch salon settings:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !salonSettings) {
      fetchSalonSettings();
    }
  }, [isOpen, salonSettings, fetchSalonSettings]);

  // Convert salon schedule to stylist working hours format
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

  // Reset form when stylist changes (opening modal for different stylist)
  useEffect(() => {
    if (stylist) {
      // Editing existing stylist - use their stored hours
      setFormData({
        name: stylist.name,
        email: stylist.email || '',
        bio: stylist.bio || '',
        avatar: stylist.avatar || '',
        specialtyCategoryIds: stylist.specialties.map(cat => cat.id),
        workingHours: stylist.workingHours,
        blockedDates: [], // Don't edit blocked dates here
        userId: '',
      });
      setSelectedUser(null);
      setUserSearchQuery('');
      setUserSearchResults([]);
      setFormInitialized(true);
    } else {
      // Creating new stylist - reset initialization flag
      setFormInitialized(false);
    }
    setError('');
  }, [stylist]);

  // For new stylists, update working hours when salon settings load
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

    // Name and specialties are required; email only required if not linked to user
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
        const errorData = await response.json();
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

  // Search for users to promote
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
        const users = await response.json();
        setUserSearchResults(users);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Select a user to promote to stylist
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

  // Clear selected user
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

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('invalidFileType'));
      return;
    }

    // Validate file size (5MB)
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
        const errorData = await response.json();
        throw new Error(errorData.message || t('avatarUploadFailed'));
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, avatar: data.url }));
      // Notify parent to update the stylist card immediately
      if (onAvatarChange) {
        onAvatarChange(data.url);
      }

      // If editing an existing stylist, save avatar to database immediately
      if (stylist) {
        const saveResponse = await fetch(`/api/stylists/${stylist.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: data.url }),
        });
        if (!saveResponse.ok) {
          console.error('Failed to save avatar to database');
        }
      }

      toast.success(t('avatarUploadSuccess'), { id: uploadToast });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('avatarUploadFailed');
      toast.error(errorMsg, { id: uploadToast });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
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
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stylist ? t('edit') : t('addNew')}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection (only for new stylists) */}
          {!stylist && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {t('selectUserPromote')} *
              </label>
              <p className="text-xs text-gray-500 mb-3">{t('selectUserPromoteDesc')}</p>

              {selectedUser ? (
                // Show selected user
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
                // Show search input
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

                  {/* Search Results Dropdown */}
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

          {/* Stylist Name (editable, auto-filled from selected user) */}
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

          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {t('avatarPhoto')}
            </label>
            <div className="flex items-center gap-4">
              {/* Avatar Preview */}
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                {formData.avatar ? (
                  <Image src={formData.avatar} alt="Avatar preview" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400"></div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  id="avatar-upload"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>Upload Photo</>
                    )}
                  </Button>
                  {formData.avatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP or GIF. Max 5MB.</p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="stylist-bio" className="block text-sm font-medium text-gray-900 mb-2">
              Bio
            </label>
            <Textarea
              id="stylist-bio"
              value={formData.bio}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData(prev => ({ ...prev, bio: e.target.value }))
              }
              rows={3}
              placeholder="Brief description of the stylist's experience and style"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900">
                Specialties (Service Categories) *
              </label>
              <button
                type="button"
                onClick={() => {
                  const allIds = availableCategories.map(cat => cat.id);
                  const allSelected = allIds.every(id =>
                    formData.specialtyCategoryIds.includes(id),
                  );
                  setFormData(prev => ({
                    ...prev,
                    specialtyCategoryIds: allSelected ? [] : allIds,
                  }));
                }}
                className="text-sm text-primary hover:text-primary-700 font-medium"
              >
                {availableCategories.length > 0 &&
                availableCategories.every(cat => formData.specialtyCategoryIds.includes(cat.id))
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-gray-200 rounded-md p-3">
              {availableCategories.map(category => {
                const isSelected = formData.specialtyCategoryIds.includes(category.id);
                return (
                  <label
                    key={category.id}
                    className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{category.title}</h4>
                      {category.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Working Hours Section */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              <Clock className="inline-block w-4 h-4 mr-1" />
              Working Hours
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Default hours match salon schedule. Adjust as needed for this stylist.
            </p>
            <div className="border border-gray-200 rounded-md p-3 space-y-2">
              {daysOfWeek.map(day => {
                const hours = formData.workingHours[day];
                return (
                  <div
                    key={day}
                    className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="w-24">
                      <label className="flex items-center cursor-pointer">
                        <Checkbox
                          checked={hours.isWorking}
                          onCheckedChange={checked =>
                            updateWorkingHours(day, 'isWorking', !!checked)
                          }
                          className="mr-2"
                        />
                        <span className="text-sm font-medium capitalize">{day.slice(0, 3)}</span>
                      </label>
                    </div>
                    {hours.isWorking ? (
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          value={hours.start}
                          onChange={e => updateWorkingHours(day, 'start', e.target.value)}
                          className="px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
                        >
                          {timeOptions.map(t => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <span className="text-gray-500">to</span>
                        <select
                          value={hours.end}
                          onChange={e => updateWorkingHours(day, 'end', e.target.value)}
                          className="px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
                        >
                          {timeOptions.map(t => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Day off</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || formData.specialtyCategoryIds.length === 0}
              className="flex-1"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {stylist ? 'Updating...' : 'Creating...'}
                </span>
              ) : stylist ? (
                'Update Stylist'
              ) : (
                'Create Stylist'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

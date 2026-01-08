'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Plus } from '@/lib/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';

import type { Stylist, ServiceCategory } from '@/types';
import StylistForm from './StylistForm';
import StylistRosterView from './StylistRosterView';
import StylistSmartGridView from './StylistSmartGridView';

interface StylistManagementProps {
  onClose?: () => void;
  showAddModal?: boolean;
  setShowAddModal?: (show: boolean) => void;
}

export default function StylistManagement({
  onClose,
  showAddModal: externalShowAddModal,
  setShowAddModal: externalSetShowAddModal,
}: StylistManagementProps) {
  const t = useTranslations('Admin.Stylists');

  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [availableCategories, setAvailableCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [internalShowAddModal, setInternalShowAddModal] = useState(false);

  // Use external state if provided, otherwise use internal state
  const showAddModal = externalShowAddModal ?? internalShowAddModal;
  const setShowAddModal = externalSetShowAddModal ?? setInternalShowAddModal;

  // AlertDialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stylistToDeleteId, setStylistToDeleteId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/services');
      const data = (await response.json()) as ServiceCategory[];
      // Get just the category info (without items) for specialty selection
      const categories = data.map((cat: ServiceCategory) => ({
        id: cat.id,
        slug: cat.slug,
        title: cat.title,
        shortTitle: cat.shortTitle,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        items: [],
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
      const data = (await response.json()) as Stylist[];
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

  // Determine if we should show the main "Add Stylist" button
  const showMainAddButton = !externalSetShowAddModal;

  return (
    <>
      <div>
        <div className="space-y-8">
          {/* Roster View (Top) */}
          <StylistRosterView stylists={stylists} onStylistUpdate={fetchStylists} />

          {/* Grid View (Bottom) */}
          <div>
            {showMainAddButton && (
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{t('title')}</h2>
                <div className="flex space-x-3">
                  <Button onClick={() => setShowAddModal(true)} className="bg-primary text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addStylist')}
                  </Button>
                </div>
              </div>
            )}

            {stylists.length === 0 ? (
              <div className="bg-white p-8 rounded-lg text-center border border-dashed border-gray-300">
                <div className="relative w-48 h-48 mx-auto mb-4 opacity-50">
                  <Image
                    src="/images/illustrations/stylist-team-empty.png"
                    alt={t('noStylistsYet')}
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noStylistsYet')}</h3>
                <p className="text-gray-600 mb-4">{t('noStylistsDesc')}</p>
                <Button onClick={() => setShowAddModal(true)} variant="default">
                  {t('addFirstStylist')}
                </Button>
              </div>
            ) : (
              <StylistSmartGridView
                stylists={stylists}
                availableCategories={availableCategories}
                fetchStylists={fetchStylists}
                onDelete={handleDeleteStylist}
              />
            )}
          </div>
        </div>

        {/* Add New Stylist Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addNew')}</DialogTitle>
            </DialogHeader>
            <StylistForm
              availableCategories={availableCategories}
              onSave={async () => {
                await fetchStylists();
                setShowAddModal(false);
              }}
              onCancel={() => setShowAddModal(false)}
            />
          </DialogContent>
        </Dialog>
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

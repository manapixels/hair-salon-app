'use client';

import { useState } from 'react';
import StylistManagement from '@/components/team/StylistManagement';
import { useTranslations } from 'next-intl';
import { Plus } from '@/lib/icons';

export default function StylistsPage() {
  const t = useTranslations('Admin.Stylists');
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div>
      {/* Header with Add button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center text-sm"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          <span>{t('addStylist')}</span>
        </button>
      </div>
      <StylistManagement
        onClose={() => {}}
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
      />
    </div>
  );
}

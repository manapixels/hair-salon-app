'use client';

import { Button } from '@/components/ui/button';
import { Check } from '@/lib/icons';
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CollapsedStepSummaryProps {
  selectionType: string;
  selection: string;
  price?: string;
  duration?: string;
  onEdit: () => void;
  id?: string;
}

export const CollapsedStepSummary: React.FC<CollapsedStepSummaryProps> = ({
  selectionType,
  selection,
  price,
  duration,
  onEdit,
  id,
}) => {
  const t = useTranslations('BookingForm');
  return (
    <div
      className="border border-gray-300 bg-gray-50 rounded-lg mb-4 transition-all duration-200"
      role="region"
      aria-label={`Completed: ${selection}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-2 flex-1 min-w-0 p-3">
          {/* Checkmark */}
          <div className="flex items-center justify-center w-6 h-6 shrink-0">
            <Check strokeWidth={4} className="h-3.5 w-3.5 text-gray-600" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 id={id} className="text-sm mb-1">
              <span className="text-gray-600">{selectionType}</span>:{' '}
              <b className="text-primary font-medium">{selection}</b>
            </h3>

            {/* Optional badges */}
            {(price || duration) && (
              <div className="flex items-center gap-2 flex-wrap">
                {price && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                    {price}
                  </span>
                )}
                {duration && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                    {duration}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Single Edit button */}
        <Button
          variant="secondary"
          className="bg-gray-100 hover:bg-gray-200 h-auto self-stretch"
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            onEdit();
          }}
          aria-label={`Edit ${selection}`}
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('edit')}</span>
        </Button>
      </div>
    </div>
  );
};

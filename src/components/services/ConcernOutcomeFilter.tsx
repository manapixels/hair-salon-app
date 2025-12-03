'use client';

import * as React from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { FilterPill } from './FilterPill';
import * as Icons from 'lucide-react';

interface ServiceTag {
  id: string;
  slug: string;
  label: string;
  category: 'CONCERN' | 'OUTCOME' | 'HAIR_TYPE';
  iconName?: string | null;
}

interface ConcernOutcomeFilterProps {
  tags: ServiceTag[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onClear?: () => void;
  className?: string;
}

export function ConcernOutcomeFilter({
  tags,
  selectedTags,
  onTagsChange,
  onClear,
  className = '',
}: ConcernOutcomeFilterProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const concernTags = tags.filter(tag => tag.category === 'CONCERN');
  const outcomeTags = tags.filter(tag => tag.category === 'OUTCOME');

  const toggleTag = (slug: string) => {
    if (selectedTags.includes(slug)) {
      onTagsChange(selectedTags.filter(s => s !== slug));
    } else {
      onTagsChange([...selectedTags, slug]);
    }
  };

  const handleClear = () => {
    onTagsChange([]);
    onClear?.();
  };

  const getIcon = (iconName?: string | null) => {
    if (!iconName) return null;
    const IconComponent = (Icons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className="w-4 h-4" />;
  };

  const hasSelections = selectedTags.length > 0;

  return (
    <div className={`bg-white rounded-lg border-2 border-border ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg text-foreground">Find by hair concern or goal</span>
          {hasSelections && (
            <span className="px-2 py-1 rounded-full bg-accent/10 text-accent-foreground text-xs font-medium">
              {selectedTags.length} selected
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Filter Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border">
          {/* Concerns Section */}
          {concernTags.length > 0 && (
            <div className="pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                What&apos;s your hair concern?
              </h3>
              <div className="flex flex-wrap gap-2">
                {concernTags.map(tag => (
                  <FilterPill
                    key={tag.id}
                    label={tag.label}
                    icon={getIcon(tag.iconName)}
                    active={selectedTags.includes(tag.slug)}
                    onClick={() => toggleTag(tag.slug)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Outcomes Section */}
          {outcomeTags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                What do you want to achieve?
              </h3>
              <div className="flex flex-wrap gap-2">
                {outcomeTags.map(tag => (
                  <FilterPill
                    key={tag.id}
                    label={tag.label}
                    icon={getIcon(tag.iconName)}
                    active={selectedTags.includes(tag.slug)}
                    onClick={() => toggleTag(tag.slug)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Clear Button */}
          {hasSelections && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent-foreground hover:text-accent-foreground transition-colors"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

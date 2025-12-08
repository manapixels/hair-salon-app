'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ArrowLeft, Clock, X } from 'lucide-react';
import { useBookingModal } from '@/context/BookingModalContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { FilterPill } from './FilterPill';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '../feedback/loaders/LoadingSpinner';
import type { Service, ServiceTag, ServiceCategory } from '@/types';
import type { ServiceLink } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface FindByConcernModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceLinks: ServiceLink[];
}

export function FindByConcernModal({ isOpen, onClose, serviceLinks }: FindByConcernModalProps) {
  const [view, setView] = useState<'concerns' | 'results'>('concerns');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConcern, setSelectedConcern] = useState<ServiceTag | null>(null);
  const [availableTags, setAvailableTags] = useState<ServiceTag[]>([]);
  const [popularConcerns, setPopularConcerns] = useState<ServiceTag[]>([]);
  const [matchingCategories, setMatchingCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations('FindByConcernModal');
  const isMobile = useIsMobile();
  const { openModal: openBookingModal } = useBookingModal();
  const router = useRouter();

  // Fetch tags when modal opens
  useEffect(() => {
    if (isOpen && availableTags.length === 0) {
      setLoadingTags(true);
      setError(null);
      fetch('/api/services/tags')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch tags');
          return res.json() as Promise<{ concerns: ServiceTag[]; outcomes?: ServiceTag[] }>;
        })
        .then(data => {
          const tags = [...(data.concerns || []), ...(data.outcomes || [])];
          setAvailableTags(tags);
          // Set popular concerns (first 6 by sortOrder)
          setPopularConcerns(tags.slice(0, 6));
        })
        .catch(err => {
          console.error('Failed to fetch tags:', err);
          setError(t('concernsView.errorLoadingConcerns'));
        })
        .finally(() => {
          setLoadingTags(false);
        });
    }
  }, [isOpen, availableTags.length, t]);

  // Reset view when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('concerns');
        setSearchQuery('');
        setSelectedConcern(null);
        setMatchingCategories([]);
        setError(null);
      }, 300); // Wait for animation
    }
  }, [isOpen]);

  const handleConcernSelect = async (concernSlug: string) => {
    const concern = availableTags.find(tag => tag.slug === concernSlug);
    if (!concern) return;

    setSelectedConcern(concern);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Failed to fetch services');

      const categories = (await res.json()) as ServiceCategory[];

      // Find categories that have services matching this concern
      const relevantCategories = categories
        .filter((cat: any) => {
          const hasMatchingServices = cat.items.some((service: Service) =>
            service.serviceTags?.some(st => st.tag.slug === concern.slug),
          );
          return hasMatchingServices;
        })
        .map((cat: any) => ({
          ...cat,
          // Count how many services in this category match
          matchingServiceCount: cat.items.filter((service: Service) =>
            service.serviceTags?.some(st => st.tag.slug === concern.slug),
          ).length,
        }));

      setMatchingCategories(relevantCategories);
      setView('results');
    } catch (err) {
      console.error('Failed to load services:', err);
      setError(t('resultsView.errorLoadingServices'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setView('concerns');
    setSearchQuery('');
    setSelectedConcern(null);
    setMatchingCategories([]);
    setError(null);
  };

  const handleCategoryClick = (category: ServiceCategory) => {
    // Navigate to service category page
    router.push(`/services/${category.slug}`);
    onClose();
  };

  const content = (
    <div className="space-y-6">
      {view === 'concerns' && (
        <>
          {/* Search Interface */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              {t('concernsView.title')}
            </h2>
            <p className="text-muted-foreground text-sm">{t('concernsView.description')}</p>
          </div>

          {loadingTags ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner message={t('concernsView.loadingConcerns')} />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setError(null);
                  setLoadingTags(true);
                  fetch('/api/services/tags')
                    .then(
                      res =>
                        res.json() as Promise<{ concerns: ServiceTag[]; outcomes?: ServiceTag[] }>,
                    )
                    .then(data => {
                      const tags = [...(data.concerns || []), ...(data.outcomes || [])];
                      setAvailableTags(tags);
                      setPopularConcerns(tags.slice(0, 6));
                    })
                    .catch(() => setError(t('concernsView.errorLoadingConcerns')))
                    .finally(() => setLoadingTags(false));
                }}
              >
                {t('concernsView.tryAgain')}
              </Button>
            </div>
          ) : (
            <>
              {/* Command Search Component */}
              <Command className="rounded-lg border">
                <CommandInput
                  placeholder={t('concernsView.searchPlaceholder')}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>{t('concernsView.noConcernsFound')}</CommandEmpty>

                  {/* Popular Concerns - Always visible */}
                  {!searchQuery && (
                    <CommandGroup heading={t('concernsView.popularConcerns')}>
                      {popularConcerns.map(concern => (
                        <CommandItem
                          key={concern.id}
                          value={concern.slug}
                          keywords={[concern.label, concern.slug, concern.description || '']}
                          onSelect={handleConcernSelect}
                          className="cursor-pointer"
                        >
                          <div>
                            <div className="font-medium">{concern.label}</div>
                            {concern.description && (
                              <div className="text-xs">{concern.description}</div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* All Concerns - Show when searching */}
                  {searchQuery && (
                    <CommandGroup heading={t('concernsView.allConcerns')}>
                      {availableTags.map(concern => (
                        <CommandItem
                          key={concern.id}
                          value={concern.slug}
                          keywords={[concern.label, concern.slug, concern.description || '']}
                          onSelect={handleConcernSelect}
                          className="cursor-pointer"
                        >
                          <div>
                            <div className="font-medium">{concern.label}</div>
                            {concern.description && (
                              <div className="text-xs">{concern.description}</div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </>
          )}
        </>
      )}

      {view === 'results' && (
        <>
          {/* Service Results View */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {t('resultsView.servicesFor')} {selectedConcern?.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                {matchingCategories.length}{' '}
                {matchingCategories.length !== 1
                  ? t('resultsView.serviceCategories')
                  : t('resultsView.serviceCategory')}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner message={t('resultsView.findingServices')} />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={handleBack}>
                {t('resultsView.backToSearch')}
              </Button>
            </div>
          ) : matchingCategories.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground mb-4">{t('resultsView.noServicesFound')}</p>
              <Button variant="outline" onClick={handleBack}>
                {t('resultsView.tryAnotherSearch')}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {matchingCategories.map(category => {
                // Get services that match the concern
                const relevantServices = category.items.filter(service =>
                  service.serviceTags?.some(st => st.tag.slug === selectedConcern?.slug),
                );

                return (
                  <div
                    key={category.id}
                    className="bg-card border rounded-lg overflow-hidden hover:border-primary transition-all hover:shadow-lg"
                  >
                    {/* Category Header */}
                    <div className="p-4 border-b bg-muted/30">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {category.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              {category.matchingServiceCount}{' '}
                              {category.matchingServiceCount === 1
                                ? t('resultsView.matchingService')
                                : t('resultsView.matchingServices')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCategoryClick(category)}
                          >
                            {t('resultsView.learnMore')}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              onClose();
                              setTimeout(() => {
                                openBookingModal({});
                              }, 300);
                            }}
                          >
                            {t('resultsView.bookNow')}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Services Table */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableBody>
                          {relevantServices
                            .filter(service => service.isActive)
                            .map(service => (
                              <TableRow key={service.id} className="hover:bg-muted/30 bg-primary/5">
                                <TableCell className="text-sm font-bold text-primary">
                                  {service.name}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {service.subtitle || service.description || '—'}
                                </TableCell>
                                <TableCell className="text-right text-sm font-semibold text-primary">
                                  {service.price}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={open => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="sr-only">
              {view === 'concerns'
                ? t('accessibility.concernsTitle')
                : t('accessibility.resultsTitle', { concernLabel: selectedConcern?.label || '' })}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              {view === 'concerns'
                ? t('accessibility.concernsDescription')
                : t('accessibility.resultsDescription', { count: matchingCategories.length })}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 max-h-[85vh] overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50',
            'bg-black/50 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50',
            'translate-x-[-50%] translate-y-[-50%]',
            'w-full max-w-4xl',
            'max-h-[85vh] overflow-y-auto',
            'rounded-lg',
            'bg-card',
            'border shadow-xl',
            'p-6',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'duration-200',
          )}
        >
          {content}
          <Dialog.Close
            className={cn(
              'absolute right-4 top-4',
              'rounded-full p-2',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-primary/10',
              'transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            )}
            aria-label={t('accessibility.closeModal')}
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

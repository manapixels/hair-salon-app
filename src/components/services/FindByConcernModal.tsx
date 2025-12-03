'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { ArrowLeft, Clock, X } from 'lucide-react';
import { useBookingModal } from '@/context/BookingModalContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { FilterPill } from './FilterPill';
import { Button } from '@/components/ui/button';
import { SERVICE_LINKS } from '@/config/navigation';
import { LoadingSpinner } from '../feedback/loaders/LoadingSpinner';
import type { Service, ServiceTag } from '@/types';
import { cn } from '@/lib/utils';

interface FindByConcernModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FindByConcernModal({ isOpen, onClose }: FindByConcernModalProps) {
  const [view, setView] = useState<'concerns' | 'results'>('concerns');
  const [selectedConcern, setSelectedConcern] = useState<ServiceTag | null>(null);
  const [availableTags, setAvailableTags] = useState<ServiceTag[]>([]);
  const [matchingServices, setMatchingServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          return res.json();
        })
        .then(data => {
          const tags = [...(data.concerns || []), ...(data.outcomes || [])];
          setAvailableTags(tags);
        })
        .catch(err => {
          console.error('Failed to fetch tags:', err);
          setError('Unable to load concerns. Please try again.');
        })
        .finally(() => {
          setLoadingTags(false);
        });
    }
  }, [isOpen, availableTags.length]);

  // Reset view when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('concerns');
        setSelectedConcern(null);
        setMatchingServices([]);
        setError(null);
      }, 300); // Wait for animation
    }
  }, [isOpen]);

  const handleConcernSelect = async (concern: ServiceTag) => {
    setSelectedConcern(concern);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Failed to fetch services');

      const categories = await res.json();
      const services = categories
        .flatMap((cat: any) => cat.items)
        .filter((service: Service) => service.serviceTags?.some(st => st.tag.slug === concern.slug))
        .sort((a: Service, b: Service) => (b.popularityScore || 0) - (a.popularityScore || 0));

      setMatchingServices(services);
      setView('results');
    } catch (err) {
      console.error('Failed to load services:', err);
      setError('Unable to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setView('concerns');
    setSelectedConcern(null);
    setMatchingServices([]);
    setError(null);
  };

  const handleLearnMore = (service: Service) => {
    const serviceLink = SERVICE_LINKS.find(link => link.title === service.name);
    if (serviceLink) {
      router.push(serviceLink.href);
      onClose();
    }
  };

  const handleBookNow = (service: Service) => {
    onClose();
    setTimeout(() => {
      openBookingModal({ preSelectedServiceId: service.id });
    }, 300);
  };

  const content = (
    <div className="space-y-6">
      {view === 'concerns' && (
        <>
          {/* Concern Selection View */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-[var(--gray-12)] mb-2">
              Find by Hair Concern
            </h2>
            <p className="text-[var(--gray-11)] text-sm">
              Select a concern to discover matching services
            </p>
          </div>

          {loadingTags ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner message="Loading concerns..." />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-[var(--red-11)] mb-4">{error}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setError(null);
                  setLoadingTags(true);
                  fetch('/api/services/tags')
                    .then(res => res.json())
                    .then(data => {
                      const tags = [...(data.concerns || []), ...(data.outcomes || [])];
                      setAvailableTags(tags);
                    })
                    .catch(() => setError('Unable to load concerns. Please try again.'))
                    .finally(() => setLoadingTags(false));
                }}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableTags.map(tag => (
                <FilterPill
                  key={tag.id}
                  label={tag.label}
                  active={false}
                  onClick={() => handleConcernSelect(tag)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {view === 'results' && (
        <>
          {/* Service Results View */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-[var(--gray-4)] rounded-full transition-colors"
              aria-label="Back to concerns"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--gray-11)]" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-[var(--gray-12)]">
                Services for {selectedConcern?.label}
              </h2>
              <p className="text-sm text-[var(--gray-11)]">
                {matchingServices.length} service{matchingServices.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner message="Finding services..." />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-[var(--red-11)] mb-4">{error}</p>
              <Button variant="outline" onClick={handleBack}>
                Back to Concerns
              </Button>
            </div>
          ) : matchingServices.length === 0 ? (
            <div className="text-center py-12 bg-[var(--gray-2)] rounded-lg">
              <p className="text-[var(--gray-11)] mb-4">No services found for this concern.</p>
              <Button variant="outline" onClick={handleBack}>
                Try Another Concern
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2">
              {matchingServices.map(service => {
                const serviceLink = SERVICE_LINKS.find(link => link.title === service.name);
                const imageUrl =
                  serviceLink?.image || service.imageUrl || '/images/default-service.jpg';

                return (
                  <div
                    key={service.id}
                    className="bg-white border border-[var(--gray-6)] rounded-lg overflow-hidden hover:border-[var(--accent-8)] transition-all hover:shadow-md"
                  >
                    <div className="relative h-48 w-full">
                      <Image
                        src={imageUrl}
                        alt={service.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-[var(--gray-12)] mb-1">
                          {service.name}
                        </h3>
                        <p className="text-[var(--accent-11)] font-bold">{service.price}</p>
                      </div>

                      {service.subtitle && (
                        <p className="text-sm text-[var(--gray-11)] line-clamp-2">
                          {service.subtitle}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-[var(--gray-10)]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.duration} mins</span>
                        {(service.popularityScore || 0) >= 80 && (
                          <>
                            <span>•</span>
                            <span className="text-[var(--accent-11)] font-medium">Popular</span>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLearnMore(service)}
                          className="flex-1"
                        >
                          Learn More
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleBookNow(service)}
                          className="flex-1"
                        >
                          Book Now
                        </Button>
                      </div>
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
                ? 'Find by Hair Concern'
                : `Services for ${selectedConcern?.label}`}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              {view === 'concerns'
                ? 'Select a hair concern to find matching services'
                : `Showing ${matchingServices.length} matching services`}
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
            'bg-[var(--color-panel)]',
            'border border-[var(--gray-6)]',
            'shadow-xl',
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
              'text-[var(--gray-11)] hover:text-[var(--gray-12)]',
              'hover:bg-[var(--gray-4)]',
              'transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]',
            )}
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

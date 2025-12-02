'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { toast } from 'sonner';

import type {
  Service,
  TimeSlot,
  Appointment,
  Stylist,
  ServiceCategory,
  ServiceAddon,
  ServiceTag,
} from '@/types';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/context/AuthContext';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import {
  calculateEndTime,
  formatDuration,
  getDurationColor,
  getDurationPercentage,
  formatDisplayDate,
} from '@/lib/timeUtils';
import { LoadingSpinner } from '../feedback/loaders/LoadingSpinner';
import { StylistCardSkeleton } from '../feedback/loaders/StylistCardSkeleton';
import { ErrorState } from '../feedback/ErrorState';
import { EmptyState } from '../feedback/EmptyState';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { TextField } from '../ui/TextField';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check, CheckCircle, User, WhatsAppIcon, Search } from '@/lib/icons';
import { ConcernOutcomeFilter } from '../services/ConcernOutcomeFilter';
import { MobileBookingSummary } from './MobileBookingSummary';
import { BookingConfirmationSummary } from './BookingConfirmationSummary';
import { useRef } from 'react';
import { Edit2 } from 'lucide-react';

// Code-split heavy components for better performance
const StylistSelector = dynamic(
  () => import('./StylistSelector').then(mod => ({ default: mod.StylistSelector })),
  {
    loading: () => (
      <div className="mt-10 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          2. Choose Your Stylist
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <LoadingSpinner size="sm" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading stylists...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StylistCardSkeleton count={3} />
          </div>
        </div>
      </div>
    ),
    ssr: false,
  },
);

const CalendlyStyleDateTimePicker = dynamic(() => import('./CalendlyStyleDateTimePicker'), {
  loading: () => (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
        3. Select Date & Time
      </h2>
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner message="Loading calendar..." />
      </div>
    </div>
  ),
  ssr: false,
});

// Get the salon's timezone from environment variable or default to Asia/Singapore
const SALON_TIMEZONE = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_TIMEZONE || 'Asia/Singapore';

// Helper function to get the current date in the salon's timezone
const getTodayInSalonTimezone = (): Date => {
  const now = new Date();
  return toZonedTime(now, SALON_TIMEZONE);
};

// Collapsed Step Summary Component
const CollapsedStepSummary: React.FC<{
  stepNumber: number;
  title: string;
  summary: string;
  price?: string;
  duration?: string;
  onEdit: () => void;
  id?: string;
}> = ({ stepNumber, title, summary, price, duration, onEdit, id }) => {
  return (
    <div
      className="border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-4 transition-all duration-200"
      role="region"
      aria-label={`Completed: ${title}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Checkmark - neutral gray */}
          <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-gray-400 dark:border-gray-600 shrink-0">
            <Check className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 id={id} className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {stepNumber}. {title}
            </h3>

            {/* Summary */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1.5">{summary}</p>

            {/* Optional badges */}
            {(price || duration) && (
              <div className="flex items-center gap-2 flex-wrap">
                {price && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {price}
                  </span>
                )}
                {duration && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {duration}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Single Edit button */}
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors shrink-0"
          aria-label={`Edit ${title}`}
        >
          <Edit2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </button>
      </div>
    </div>
  );
};

const ServiceSelector: React.FC<{
  categories: ServiceCategory[];
  selectedServices: Service[];
  selectedAddons: string[];
  onServiceToggle: (service: Service) => void;
  onAddonToggle: (addonId: string, serviceId: string) => void;
  loading: boolean;
}> = ({
  categories,
  selectedServices,
  selectedAddons,
  onServiceToggle,
  onAddonToggle,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<ServiceTag[]>([]);

  // Fetch available tags
  useEffect(() => {
    fetch('/api/services/tags')
      .then(res => res.json())
      .then(data => {
        const allTags = [...(data.concerns || []), ...(data.outcomes || [])];
        setAvailableTags(allTags);
      })
      .catch(err => console.error('Failed to fetch tags:', err));
  }, []);

  // Initialize expanded categories
  useEffect(() => {
    if (categories.length > 0 && expandedCategories.length === 0) {
      // Default to first category expanded
      setExpandedCategories([categories[0].id]);
    }
  }, [categories, expandedCategories]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId],
    );
  };

  const filteredCategories = useMemo(() => {
    let result = categories;

    // Apply tag filter first
    if (selectedTags.length > 0) {
      result = result
        .map(category => ({
          ...category,
          items: category.items.filter(service =>
            service.serviceTags?.some(st => selectedTags.includes(st.tag.slug)),
          ),
        }))
        .filter(category => category.items.length > 0);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result
        .map(category => ({
          ...category,
          items: category.items.filter(
            service =>
              service.name.toLowerCase().includes(query) ||
              service.subtitle?.toLowerCase().includes(query) ||
              service.description?.toLowerCase().includes(query) ||
              service.tags.some(tag => tag.toLowerCase().includes(query)),
          ),
        }))
        .filter(category => category.items.length > 0);
    }

    // Apply quick filters
    if (activeFilter) {
      result = result
        .map(category => ({
          ...category,
          items: category.items.filter(service => {
            switch (activeFilter) {
              case 'quick':
                return service.duration <= 45;
              case 'budget':
                return service.basePrice <= 50;
              case 'premium':
                return service.basePrice >= 150;
              case 'popular':
                return service.popularityScore >= 80;
              default:
                return true;
            }
          }),
        }))
        .filter(category => category.items.length > 0);
    }

    return result;
  }, [categories, searchQuery, activeFilter, selectedTags]);

  // Auto-expand categories when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedCategories(filteredCategories.map(c => c.id));
    }
  }, [searchQuery, filteredCategories]);

  // Helper to get filtered categories for the current view

  // Helper to get filtered categories for the current view
  const displayCategories = useMemo(() => {
    if (searchQuery.trim()) return filteredCategories;
    if (activeCategory === 'all') return categories;
    return categories.filter(c => c.id === activeCategory);
  }, [filteredCategories, categories, activeCategory, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          1. Select Services
        </h2>
        <div className="flex justify-center p-8">
          <LoadingSpinner message="Loading services..." />
        </div>
      </div>
    );
  }

  return (
    <div id="service-selector">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        1. Select Services
      </h2>

      {/* Concern/Outcome Filter */}
      {availableTags.length > 0 && (
        <div className="mb-4">
          <ConcernOutcomeFilter
            tags={availableTags}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            onClear={() => setSelectedTags([])}
          />
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search services (e.g., 'cut', 'color', 'treatment')..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-stone-900 focus:border-stone-900 sm:text-sm transition duration-150 ease-in-out"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            if (e.target.value.trim()) {
              setActiveCategory('all');
              setActiveFilter(null);
            }
          }}
        />
      </div>

      {/* Quick Filters */}
      {!searchQuery.trim() && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveFilter(activeFilter === 'quick' ? null : 'quick')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === 'quick'
                ? 'bg-stone-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Quick (Under 45 min)
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'budget' ? null : 'budget')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === 'budget'
                ? 'bg-stone-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Budget (Under $50)
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'premium' ? null : 'premium')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === 'premium'
                ? 'bg-stone-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            Premium
          </button>
          <button
            onClick={() => setActiveFilter(activeFilter === 'popular' ? null : 'popular')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === 'popular'
                ? 'bg-stone-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Popular
          </button>
        </div>
      )}

      {/* Category Tabs (Desktop) */}
      {!searchQuery.trim() && (
        <div className="hidden md:flex space-x-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Services
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === category.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.title}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-8">
        {displayCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No services found matching &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          <Accordion
            type="multiple"
            value={expandedCategories}
            onValueChange={setExpandedCategories}
            className="w-full space-y-4"
          >
            {displayCategories.map(category => (
              <div
                key={category.id}
                className={
                  !searchQuery.trim() && activeCategory !== 'all' && activeCategory !== category.id
                    ? 'hidden'
                    : ''
                }
              >
                <AccordionItem value={category.id} className="border-none">
                  <AccordionTrigger className="w-full flex items-center justify-between text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide sticky top-0 bg-[#FDFCF8] px-4 py-3 z-10 hover:text-stone-900 transition-colors rounded-md hover:no-underline group">
                    <div className="flex flex-col items-start text-left">
                      <span>{category.title}</span>
                      {category.description && (
                        <span className="text-xs font-normal normal-case text-[var(--gray-10)] tracking-normal mt-0.5">
                          {category.description}
                          {category.priceRangeMin && category.priceRangeMax && (
                            <>
                              {' '}
                              • ${category.priceRangeMin}-${category.priceRangeMax}
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200 pt-2">
                      {category.items.map(service => {
                        const isSelected = selectedServices.some(s => s.id === service.id);
                        return (
                          <Card
                            key={service.id}
                            variant="interactive"
                            selected={isSelected}
                            showCheckmark
                            onClick={() => onServiceToggle(service)}
                            className="cursor-pointer h-full"
                          >
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                  <CardTitle className="text-base">{service.name}</CardTitle>
                                  {service.subtitle && (
                                    <p className="text-xs text-[var(--gray-10)] mt-0.5">
                                      {service.subtitle}
                                    </p>
                                  )}
                                </div>
                                <span className="text-sm font-semibold text-[var(--gray-12)] shrink-0">
                                  {service.price}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {service.description && (
                                <p className="text-sm text-[var(--gray-11)] mb-2">
                                  {service.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-[var(--gray-10)] mb-3">
                                <span>{service.duration} mins</span>
                                {service.popularityScore >= 80 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent-3)] text-[var(--accent-11)] font-medium">
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    Popular
                                  </span>
                                )}
                              </div>

                              {/* Add-ons Section */}
                              {isSelected && service.addons && service.addons.length > 0 && (
                                <div
                                  className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-semibold text-[var(--gray-11)] uppercase tracking-wide">
                                      Enhance Your Service
                                    </p>
                                    {service.addons.some(a => a.isRecommended) && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-3)] text-[var(--accent-11)] font-medium">
                                        Recommended
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    {service.addons.map(addon => {
                                      const isAddonSelected = selectedAddons.includes(addon.id);
                                      return (
                                        <label
                                          key={addon.id}
                                          htmlFor={addon.id}
                                          className={`
                                            flex items-start gap-2 p-2 rounded-lg border cursor-pointer
                                            transition-all
                                            ${
                                              isAddonSelected
                                                ? 'border-[var(--accent-8)] bg-[var(--accent-2)]'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }
                                          `}
                                        >
                                          <input
                                            type="checkbox"
                                            id={addon.id}
                                            checked={isAddonSelected}
                                            onChange={() => onAddonToggle(addon.id, service.id)}
                                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent shrink-0"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                              <span className="text-sm font-medium text-[var(--gray-12)]">
                                                {addon.name}
                                              </span>
                                              <span className="text-sm font-semibold text-[var(--gray-12)] shrink-0">
                                                {addon.price}
                                              </span>
                                            </div>
                                            {addon.description && (
                                              <p className="text-xs text-[var(--gray-11)] mt-1">
                                                {addon.description}
                                              </p>
                                            )}
                                            {addon.benefits && addon.benefits.length > 0 && (
                                              <ul className="mt-1.5 space-y-0.5">
                                                {addon.benefits.map((benefit, i) => (
                                                  <li
                                                    key={i}
                                                    className="text-xs text-[var(--gray-10)] flex items-center gap-1"
                                                  >
                                                    <svg
                                                      className="w-3 h-3 text-green-600 shrink-0"
                                                      fill="currentColor"
                                                      viewBox="0 0 20 20"
                                                    >
                                                      <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                      />
                                                    </svg>
                                                    {benefit}
                                                  </li>
                                                ))}
                                              </ul>
                                            )}
                                            {addon.isPopular && (
                                              <p className="text-xs text-[var(--accent-11)] mt-1.5 font-medium">
                                                ⭐ Popular choice
                                              </p>
                                            )}
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </div>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
};

const TimeSlotCard: React.FC<{
  time: string;
  duration: number;
  isSelected: boolean;
  isAvailable: boolean;
  onClick: () => void;
}> = ({ time, duration, isSelected, isAvailable, onClick }) => {
  const endTime = calculateEndTime(time, duration);
  const durationText = formatDuration(duration);

  return (
    <button
      disabled={!isAvailable}
      onClick={onClick}
      className={`
        relative p-4 rounded-lg text-left transition-all duration-200
        ${
          isSelected
            ? 'bg-accent ring-2 ring-accent shadow-lg scale-105'
            : isAvailable
              ? 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-accent hover:shadow-md'
              : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed'
        }
      `}
      aria-label={`${time} to ${endTime}, ${durationText}`}
      aria-pressed={isSelected}
    >
      <div className="flex flex-col gap-1">
        {/* Start time - prominent */}
        <span className="text-sm font-bold">{time}</span>

        {/* Duration bar */}
        <div
          className={`mb-1 rounded-full h-1.5 overflow-hidden ${
            isSelected ? 'bg-accent-soft' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <div
            className={`h-full transition-all ${
              isSelected ? 'bg-white' : getDurationColor(duration)
            }`}
            style={{ width: `${getDurationPercentage(duration)}%` }}
          />
        </div>

        {/* End time */}
        <span
          className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}
        >
          to {endTime}
        </span>

        {/* Duration label */}
        <div
          className={`flex items-center gap-1 text-xs ${
            isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-500'
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{durationText}</span>
        </div>
      </div>
    </button>
  );
};

const DateTimePicker: React.FC<{
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  totalDuration: number;
  selectedStylist: Stylist | null;
}> = ({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeSelect,
  totalDuration,
  selectedStylist,
}) => {
  const { getAvailableSlots } = useBooking();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const showLoader = useDelayedLoading(loading, { delay: 150, minDuration: 300 });

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      try {
        const availableSlots = await getAvailableSlots(selectedDate, selectedStylist?.id);
        const slots = availableSlots.map(slot => ({ time: slot, available: true }));
        setTimeSlots(slots);
      } catch (error) {
        console.error('Failed to fetch time slots:', error);
        toast.error('Unable to load available times. Please try another date.');
        setTimeSlots([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedStylist, getAvailableSlots]);

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
        3. Select Date & Time
      </h2>

      {/* Time Slots */}
      {showLoader ? (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner message="Finding available times..." />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Available Times for{' '}
              <span className="text-accent dark:text-accent font-bold">
                {format(selectedDate, 'EEEE, MMMM d')}
              </span>
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {timeSlots.length} slot{timeSlots.length !== 1 ? 's' : ''} available
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {timeSlots.length > 0 ? (
              timeSlots.map(({ time, available }) => (
                <TimeSlotCard
                  key={time}
                  time={time}
                  duration={totalDuration}
                  isSelected={selectedTime === time}
                  isAvailable={available}
                  onClick={() => onTimeSelect(time)}
                />
              ))
            ) : (
              <div className="col-span-full text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">
                  No available slots on {format(selectedDate, 'MMMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Try selecting a different date, or contact us for assistance
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ConfirmationForm: React.FC<{
  onConfirm: (name: string, email: string) => void;
  isSubmitting: boolean;
  whatsappUrl: string;
  showWhatsAppFallback?: boolean;
  selectedServices: Service[];
  selectedStylist: Stylist | null;
  selectedDate: Date;
  selectedTime: string;
  totalDuration: number;
}> = ({
  onConfirm,
  isSubmitting,
  whatsappUrl,
  showWhatsAppFallback = false,
  selectedServices,
  selectedStylist,
  selectedDate,
  selectedTime,
  totalDuration,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Please fill in both your name and email.');
      return;
    }
    setError('');
    onConfirm(name, email);
  };
  return (
    <div className="mt-10">
      <h2
        id="step-4-heading"
        className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200"
      >
        4. Confirm Your Booking
      </h2>

      <BookingConfirmationSummary
        selectedServices={selectedServices}
        selectedStylist={selectedStylist}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        totalDuration={totalDuration}
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-lg bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
      >
        <TextField
          label="Full Name"
          id="name"
          type="text"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          disabled={!!user}
          required
          className="text-base"
        />
        <TextField
          label="Email Address"
          id="email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          disabled={!!user}
          required
          className="text-base"
        />
        {error && <p className="text-[length:var(--font-size-2)] text-[var(--red-11)]">{error}</p>}
        <Button
          type="submit"
          variant="solid"
          size="lg"
          fullWidth
          loading={isSubmitting}
          loadingText="Booking..."
          disabled={isSubmitting}
          className="py-4 text-[length:var(--font-size-4)]"
          aria-label={isSubmitting ? 'Booking in progress' : 'Confirm your appointment'}
        >
          <CheckCircle className="h-6 w-6" aria-hidden="true" />
          Confirm Appointment
        </Button>

        {/* WhatsApp Fallback */}
        {showWhatsAppFallback && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
              Prefer personal assistance?
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
              aria-label="Contact us on WhatsApp for booking assistance"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Chat with us on WhatsApp
            </a>
          </div>
        )}
      </form>
    </div>
  );
};

const BookingSummary: React.FC<{
  selectedServices: Service[];
  selectedStylist: Stylist | null;
  selectedDate: Date;
  selectedTime: string | null;
  totalPrice: number;
  totalDuration: number;
  selectedAddons: string[];
  onClear: () => void;
}> = ({
  selectedServices,
  selectedStylist,
  selectedDate,
  selectedTime,
  totalPrice,
  totalDuration,
  selectedAddons,
  onClear,
}) => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg sticky top-8">
      <div className="flex justify-between items-center mb-5 border-b pb-4 dark:border-gray-700">
        <h3 className="text-xl font-bold">Booking Summary</h3>
        <button onClick={onClear} className="text-sm text-red-500 hover:underline font-semibold">
          Clear All
        </button>
      </div>
      {selectedServices.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Select services to get started.</p>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {selectedServices.map(s => (
              <div key={s.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{s.name}</span>
                  <span className="font-semibold">${s.basePrice}</span>
                </div>
                {s.addons &&
                  s.addons.map(addon => {
                    if (selectedAddons.includes(addon.id)) {
                      return (
                        <div
                          key={addon.id}
                          className="flex justify-between text-xs text-gray-500 pl-4 mt-1"
                        >
                          <span>+ {addon.name}</span>
                          <span>{addon.price}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
              </div>
            ))}
          </div>
          <div className="border-t pt-4 dark:border-gray-700 space-y-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${totalPrice}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Duration: {totalDuration} mins
            </p>
            {selectedStylist && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Stylist: <span className="font-semibold">{selectedStylist.name}</span>
              </p>
            )}
            {selectedDate && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Date: <span className="font-semibold">{formatDisplayDate(selectedDate)}</span>
              </p>
            )}
            {selectedTime && (
              <p className="text-sm font-bold text-accent dark:text-accent">Time: {selectedTime}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

interface BookingFormProps {
  preSelectedServiceId?: string;
  disableAutoScroll?: boolean;
  onStepChange?: (step: number) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  preSelectedServiceId,
  disableAutoScroll,
  onStepChange,
}) => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayInSalonTimezone());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<Appointment | null>(null);
  const { createAppointment } = useBooking();

  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  const [stylistSelectionSkipped, setStylistSelectionSkipped] = useState(false);

  // Refs for scrolling
  const serviceSectionRef = useRef<HTMLDivElement>(null);
  const stylistSectionRef = useRef<HTMLDivElement>(null);
  const dateTimeSectionRef = useRef<HTMLDivElement>(null);
  const confirmationSectionRef = useRef<HTMLDivElement>(null);

  // Track user scrolling to prevent auto-scroll conflicts
  const [userScrolling, setUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error loading services:', error);
        toast.error('Failed to load services. Please try refreshing the page.');
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // User scroll detection
  useEffect(() => {
    const handleUserScroll = () => {
      setUserScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setUserScrolling(false), 1000);
    };

    window.addEventListener('scroll', handleUserScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleUserScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Clear selections based on current step
        if (selectedTime) setSelectedTime(null);
        else if (selectedStylist) {
          setSelectedStylist(null);
          setStylistSelectionSkipped(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTime, selectedStylist]);

  // Auto-select service when pre-selected service ID is provided
  useEffect(() => {
    if (preSelectedServiceId && categories.length > 0 && selectedServices.length === 0) {
      // Find the service across all categories
      for (const category of categories) {
        const service = category.items.find(s => s.id === preSelectedServiceId);
        if (service) {
          setSelectedServices([service]);

          // Only show toast and scroll if auto-scroll is enabled (i.e., not on service detail pages)
          if (!disableAutoScroll) {
            toast.success(`${service.name} has been pre-selected for you!`);

            setTimeout(() => {
              const element = document.getElementById('service-selector');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 500);
          }

          break;
        }
      }
    }
  }, [preSelectedServiceId, categories, selectedServices.length, disableAutoScroll]);

  // Smart reset logic: only reset when necessary
  useEffect(() => {
    // Always reset time when date changes
    setSelectedTime(null);
  }, [selectedDate]);

  // Reset stylist only when services change (but StylistSelector will handle this more intelligently)
  useEffect(() => {
    if (selectedServices.length === 0) {
      setSelectedStylist(null);
      setStylistSelectionSkipped(false);
    }
  }, [selectedServices]);

  // Update current step based on selection state
  useEffect(() => {
    let newStep = 1;
    if (bookingConfirmed) {
      newStep = 4; // Completed
    } else if (selectedTime) {
      newStep = 4; // Confirmation
    } else if (selectedServices.length > 0 && (selectedStylist || stylistSelectionSkipped)) {
      newStep = 3; // Date & Time
    } else if (selectedServices.length > 0) {
      newStep = 2; // Stylist
    } else {
      newStep = 1; // Services
    }

    setCurrentStep(newStep);
    onStepChange?.(newStep);
  }, [
    selectedServices,
    selectedStylist,
    stylistSelectionSkipped,
    selectedTime,
    bookingConfirmed,
    onStepChange,
  ]);

  // Scroll helper
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    // Don't auto-scroll if user is manually scrolling
    if (userScrolling) return;

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Small delay to allow UI to update
    setTimeout(() => {
      if (ref.current) {
        ref.current.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
        // Set focus for accessibility
        ref.current.focus();
      }
    }, 300);
  };

  const { totalPrice, totalDuration } = useMemo(() => {
    return selectedServices.reduce(
      (acc, service) => {
        acc.totalPrice += service.basePrice;
        acc.totalDuration += service.duration;

        // Add add-ons cost
        if (service.addons) {
          service.addons.forEach(addon => {
            if (selectedAddons.includes(addon.id)) {
              acc.totalPrice += addon.basePrice;
            }
          });
        }

        return acc;
      },
      { totalPrice: 0, totalDuration: 0 },
    );
  }, [selectedServices, selectedAddons]);

  // Generate WhatsApp URL with booking details
  const whatsappUrl = useMemo(() => {
    const whatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '15551234567';

    const message = `Hi! I'd like to book an appointment:

Services: ${selectedServices.map(s => s.name).join(', ')}${
      selectedStylist ? `\nStylist: ${selectedStylist.name}` : ''
    }
Date: ${format(selectedDate, 'EEEE, MMMM d, yyyy')}${selectedTime ? `\nTime: ${selectedTime}` : ''}

Please confirm availability. Thank you!`;

    return `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(message)}`;
  }, [selectedServices, selectedStylist, selectedDate, selectedTime]);

  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        // Remove service and its addons
        const newServices = prev.filter(s => s.id !== service.id);
        if (service.addons) {
          const addonIds = service.addons.map(a => a.id);
          setSelectedAddons(current => current.filter(id => !addonIds.includes(id)));
        }
        return newServices;
      } else {
        return [...prev, service];
      }
    });
  };

  const handleAddonToggle = (addonId: string, serviceId: string) => {
    setSelectedAddons(prev => {
      if (prev.includes(addonId)) {
        return prev.filter(id => id !== addonId);
      } else {
        return [...prev, addonId];
      }
    });
  };

  const handleStylistSelect = (stylist: Stylist | null) => {
    setSelectedStylist(stylist);
    setStylistSelectionSkipped(stylist === null);
    // Auto-scroll to date time picker
    scrollToSection(dateTimeSectionRef);
  };

  const handleTimeSelect = (time: string | null) => {
    setSelectedTime(time);
    if (time) {
      // Auto-scroll to confirmation
      scrollToSection(confirmationSectionRef);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && selectedServices.length > 0) {
      scrollToSection(stylistSectionRef);
    } else if (currentStep === 2) {
      // If skipping stylist
      if (!selectedStylist) setStylistSelectionSkipped(true);
      scrollToSection(dateTimeSectionRef);
    } else if (currentStep === 3 && selectedTime) {
      scrollToSection(confirmationSectionRef);
    }
  };

  const handleConfirmBooking = async (name: string, email: string) => {
    if (!selectedTime || selectedServices.length === 0) {
      toast.error('Please select services, a date, and a time before booking.');
      return;
    }
    setIsSubmitting(true);

    const toastId = toast.loading('Booking your appointment...');
    try {
      // Filter services to only include selected add-ons
      const servicesWithSelectedAddons = selectedServices.map(service => ({
        ...service,
        addons: service.addons?.filter(addon => selectedAddons.includes(addon.id)) || [],
      }));

      const confirmedAppt = await createAppointment({
        date: selectedDate,
        time: selectedTime,
        services: servicesWithSelectedAddons,
        stylistId: selectedStylist?.id,
        customerName: name,
        customerEmail: email,
      });
      setBookingConfirmed(confirmedAppt);
      toast.success('Appointment booked successfully! Confirmation sent to your email.', {
        id: toastId,
      });
    } catch (error: any) {
      toast.error(`Booking failed: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedServices([]);
    setSelectedAddons([]);
    setSelectedStylist(null);
    setStylistSelectionSkipped(false);
    setSelectedDate(getTodayInSalonTimezone());
    setSelectedTime(null);
    setBookingConfirmed(null);
    setCurrentStep(1);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditStep = (step: number) => {
    // Clear dependent selections
    if (step === 1) {
      // Editing services - clear stylist and time
      setSelectedStylist(null);
      setStylistSelectionSkipped(false);
      setSelectedTime(null);
    } else if (step === 2) {
      // Editing stylist - clear time only
      setSelectedTime(null);
    } else if (step === 3) {
      // Editing date/time - clear time
      setSelectedTime(null);
    }

    // Scroll to step
    const refs = [
      null,
      serviceSectionRef,
      stylistSectionRef,
      dateTimeSectionRef,
      confirmationSectionRef,
    ];
    if (refs[step]) {
      scrollToSection(refs[step]!);
    }
  };

  if (bookingConfirmed) {
    return (
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg max-w-lg mx-auto">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-800">
          <Check className="h-10 w-10 text-green-600 dark:text-green-300" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          Booking Confirmed!
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Thank you, {bookingConfirmed.customerName}.
        </p>
        <div className="mt-6 text-left bg-gray-50 dark:bg-gray-700 p-4 rounded-md space-y-2">
          <p>
            <strong>Services:</strong> {bookingConfirmed.services.map(s => s.name).join(', ')}
          </p>
          {bookingConfirmed.stylist && (
            <p>
              <strong>Stylist:</strong> {bookingConfirmed.stylist.name}
            </p>
          )}
          <p>
            <strong>Date:</strong> {formatDisplayDate(bookingConfirmed.date)}
          </p>
          <p>
            <strong>Time:</strong> {bookingConfirmed.time}
          </p>
          <p>
            <strong>Total:</strong> ${bookingConfirmed.totalPrice}
          </p>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          A confirmation has been sent to {bookingConfirmed.customerEmail}.
        </p>
        <Button variant="solid" size="md" onClick={handleReset} className="mt-6">
          Make Another Booking
        </Button>
      </div>
    );
  }

  return (
    <div className="relative pb-24 lg:pb-0">
      {/* Step Indicator - Moved to BookingModal header */}
      {/* <div className="mb-8">
        <SimpleStepIndicator
          currentStep={currentStep}
          totalSteps={4}
          stepLabels={['Services', 'Stylist', 'Date & Time', 'Confirm']}
        />
      </div> */}

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {currentStep === 1 && 'Step 1 of 4: Select Services'}
        {currentStep === 2 && 'Step 2 of 4: Choose Your Stylist'}
        {currentStep === 3 && 'Step 3 of 4: Select Date and Time'}
        {currentStep === 4 && 'Step 4 of 4: Confirm Your Booking'}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1: Services */}
          <div
            ref={serviceSectionRef}
            tabIndex={-1}
            className="outline-none"
            role="group"
            aria-labelledby="step-1-heading"
            aria-current={currentStep === 1 ? 'step' : undefined}
          >
            {currentStep > 1 && selectedServices.length > 0 ? (
              <CollapsedStepSummary
                stepNumber={1}
                title="Services Selected"
                summary={`${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''}: ${selectedServices.map(s => s.name).join(', ')}`}
                price={`$${totalPrice}`}
                duration={`${totalDuration} min`}
                onEdit={() => handleEditStep(1)}
                id="step-1-heading"
              />
            ) : (
              <ServiceSelector
                categories={categories}
                selectedServices={selectedServices}
                selectedAddons={selectedAddons}
                onServiceToggle={handleServiceToggle}
                onAddonToggle={handleAddonToggle}
                loading={loadingServices}
              />
            )}
          </div>

          {/* Step 2: Stylist */}
          {selectedServices.length > 0 && (
            <div
              ref={stylistSectionRef}
              className="outline-none"
              role="group"
              aria-labelledby="step-2-heading"
              aria-current={currentStep === 2 ? 'step' : undefined}
            >
              {currentStep > 2 && (selectedStylist || stylistSelectionSkipped) ? (
                <CollapsedStepSummary
                  stepNumber={2}
                  title="Stylist Selected"
                  summary={selectedStylist ? selectedStylist.name : 'No preference (Quick Book)'}
                  onEdit={() => handleEditStep(2)}
                  id="step-2-heading"
                />
              ) : (
                <div className="animate-slide-in-bottom">
                  <StylistSelector
                    selectedServices={selectedServices}
                    selectedStylist={selectedStylist}
                    onStylistSelect={handleStylistSelect}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Date & Time */}
          {(selectedStylist || stylistSelectionSkipped) && selectedServices.length > 0 && (
            <div
              ref={dateTimeSectionRef}
              className="outline-none"
              role="group"
              aria-labelledby="step-3-heading"
              aria-current={currentStep === 3 ? 'step' : undefined}
            >
              {currentStep > 3 && selectedTime ? (
                <CollapsedStepSummary
                  stepNumber={3}
                  title="Date & Time Selected"
                  summary={`${formatDisplayDate(selectedDate)} at ${selectedTime}`}
                  duration={`${totalDuration} min`}
                  onEdit={() => handleEditStep(3)}
                  id="step-3-heading"
                />
              ) : (
                <div className="animate-slide-in-bottom">
                  <CalendlyStyleDateTimePicker
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    selectedTime={selectedTime}
                    onTimeSelect={handleTimeSelect}
                    totalDuration={totalDuration}
                    selectedStylist={selectedStylist}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirmation */}
          {selectedTime && (
            <div
              ref={confirmationSectionRef}
              className="outline-none animate-scale-in"
              role="group"
              aria-labelledby="step-4-heading"
              aria-current={currentStep === 4 ? 'step' : undefined}
            >
              <ConfirmationForm
                onConfirm={handleConfirmBooking}
                isSubmitting={isSubmitting}
                whatsappUrl={whatsappUrl}
                showWhatsAppFallback={!isSubmitting}
                selectedServices={selectedServices}
                selectedStylist={selectedStylist}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                totalDuration={totalDuration}
              />
            </div>
          )}
        </div>
        <div className="lg:col-span-1 hidden lg:block">
          <BookingSummary
            selectedServices={selectedServices}
            selectedStylist={selectedStylist}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            totalPrice={totalPrice}
            totalDuration={totalDuration}
            selectedAddons={selectedAddons}
            onClear={handleReset}
          />
        </div>
      </div>

      {/* Mobile Sticky Summary */}
      <MobileBookingSummary
        totalPrice={totalPrice}
        totalDuration={totalDuration}
        currentStep={currentStep}
        totalSteps={4}
        onNext={handleNextStep}
        nextLabel={
          currentStep === 1
            ? 'Choose Stylist'
            : currentStep === 2
              ? 'Select Time'
              : currentStep === 3
                ? 'Confirm'
                : 'Book Now'
        }
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default BookingForm;

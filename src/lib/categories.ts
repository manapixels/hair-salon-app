/**
 * Service Category Helpers
 *
 * Single source of truth for service categories - queries from database.
 * Replaces the old bookingCategories.ts and navigation.ts static configs.
 */

import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

/**
 * Category data structure matching database schema
 */
export interface ServiceCategory {
  id: string;
  slug: string;
  title: string;
  shortTitle: string | null;
  description: string | null;
  icon: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  priceNote: string | null;
  estimatedDuration: number | null;
  sortOrder: number;
  isFeatured: boolean;
  imageUrl: string | null;
  illustrationUrl: string | null;
}

/**
 * Get all categories ordered by sortOrder
 */
export async function getAllCategories(): Promise<ServiceCategory[]> {
  const db = await getDb();
  const categories = await db
    .select()
    .from(schema.serviceCategories)
    .orderBy(asc(schema.serviceCategories.sortOrder));

  return categories.map(cat => ({
    id: cat.id,
    slug: cat.slug,
    title: cat.title,
    shortTitle: cat.shortTitle ?? null,
    description: cat.description ?? null,
    icon: cat.icon ?? null,
    priceRangeMin: cat.priceRangeMin ?? null,
    priceRangeMax: cat.priceRangeMax ?? null,
    priceNote: cat.priceNote ?? null,
    estimatedDuration: cat.estimatedDuration ?? null,
    sortOrder: cat.sortOrder,
    isFeatured: cat.isFeatured,
    imageUrl: cat.imageUrl ?? null,
    illustrationUrl: cat.illustrationUrl ?? null,
  }));
}

/**
 * Get only featured categories (for main navigation)
 */
export async function getFeaturedCategories(): Promise<ServiceCategory[]> {
  const db = await getDb();
  const categories = await db
    .select()
    .from(schema.serviceCategories)
    .where(eq(schema.serviceCategories.isFeatured, true))
    .orderBy(asc(schema.serviceCategories.sortOrder));

  return categories.map(cat => ({
    id: cat.id,
    slug: cat.slug,
    title: cat.title,
    shortTitle: cat.shortTitle ?? null,
    description: cat.description ?? null,
    icon: cat.icon ?? null,
    priceRangeMin: cat.priceRangeMin ?? null,
    priceRangeMax: cat.priceRangeMax ?? null,
    priceNote: cat.priceNote ?? null,
    estimatedDuration: cat.estimatedDuration ?? null,
    sortOrder: cat.sortOrder,
    isFeatured: cat.isFeatured,
    imageUrl: cat.imageUrl ?? null,
    illustrationUrl: cat.illustrationUrl ?? null,
  }));
}

/**
 * Get category by slug (e.g., 'hair-colouring' from navigation links)
 */
export async function getCategoryBySlug(slug: string): Promise<ServiceCategory | null> {
  const db = await getDb();
  const results = await db
    .select()
    .from(schema.serviceCategories)
    .where(eq(schema.serviceCategories.slug, slug))
    .limit(1);
  const cat = results[0];

  if (!cat) return null;

  return {
    id: cat.id,
    slug: cat.slug,
    title: cat.title,
    shortTitle: cat.shortTitle ?? null,
    description: cat.description ?? null,
    icon: cat.icon ?? null,
    priceRangeMin: cat.priceRangeMin ?? null,
    priceRangeMax: cat.priceRangeMax ?? null,
    priceNote: cat.priceNote ?? null,
    estimatedDuration: cat.estimatedDuration ?? null,
    sortOrder: cat.sortOrder,
    isFeatured: cat.isFeatured,
    imageUrl: cat.imageUrl ?? null,
    illustrationUrl: cat.illustrationUrl ?? null,
  };
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<ServiceCategory | null> {
  const db = await getDb();
  const results = await db
    .select()
    .from(schema.serviceCategories)
    .where(eq(schema.serviceCategories.id, id))
    .limit(1);
  const cat = results[0];

  if (!cat) return null;

  return {
    id: cat.id,
    slug: cat.slug,
    title: cat.title,
    shortTitle: cat.shortTitle ?? null,
    description: cat.description ?? null,
    icon: cat.icon ?? null,
    priceRangeMin: cat.priceRangeMin ?? null,
    priceRangeMax: cat.priceRangeMax ?? null,
    priceNote: cat.priceNote ?? null,
    estimatedDuration: cat.estimatedDuration ?? null,
    sortOrder: cat.sortOrder,
    isFeatured: cat.isFeatured,
    imageUrl: cat.imageUrl ?? null,
    illustrationUrl: cat.illustrationUrl ?? null,
  };
}

/**
 * Get all categories for booking flow (all non-archived categories)
 */
export async function getBookingCategories(): Promise<ServiceCategory[]> {
  return await getAllCategories();
}

/**
 * Navigation link interface (for components expecting this format)
 */
export interface ServiceLink {
  id: string; // Add ID property
  slug: string;
  title: string;
  short_title: string;
  href: string;
  description?: string;
  image?: string;
  illustration?: string;
}

/**
 * Get navigation links from featured categories
 * Transforms database format to navigation format
 */
export const getNavigationLinks = unstable_cache(
  async (): Promise<ServiceLink[]> => {
    const featured = await getFeaturedCategories();

    return featured.map(cat => ({
      id: cat.id,
      slug: cat.slug,
      title: cat.title,
      short_title: cat.shortTitle || cat.title,
      href: `/services/${cat.slug}`,
      description: cat.description || undefined,
      image: cat.imageUrl || undefined,
      illustration: cat.illustrationUrl || undefined,
    }));
  },
  ['navigation-links'],
  { tags: ['service-categories'], revalidate: false },
);

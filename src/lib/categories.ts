/**
 * Service Category Helpers
 *
 * Single source of truth for service categories - queries from database.
 * Replaces the old bookingCategories.ts and navigation.ts static configs.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  return await prisma.serviceCategory.findMany({
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Get only featured categories (for main navigation)
 * TEMP: Returning all categories due to Prisma client sync issue
 * TODO: Re-enable isFeatured filter after running 'npx prisma generate'
 */
export async function getFeaturedCategories(): Promise<ServiceCategory[]> {
  return await prisma.serviceCategory.findMany({
    // TEMP: Commented out until Prisma client is regenerated
    // where: { isFeatured: true },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Get category by slug (e.g., 'hair-colouring' from navigation links)
 */
export async function getCategoryBySlug(slug: string): Promise<ServiceCategory | null> {
  return await prisma.serviceCategory.findUnique({
    where: { slug },
  });
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<ServiceCategory | null> {
  return await prisma.serviceCategory.findUnique({
    where: { id },
  });
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
export async function getNavigationLinks(): Promise<ServiceLink[]> {
  const featured = await getFeaturedCategories();

  return featured.map(cat => ({
    slug: cat.slug,
    title: cat.title,
    short_title: cat.shortTitle || cat.title,
    href: `/services/${cat.slug}`,
    description: cat.description || undefined,
    image: cat.imageUrl || undefined,
    illustration: cat.illustrationUrl || undefined,
  }));
}

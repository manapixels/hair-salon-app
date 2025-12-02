/**
 * Booking Category Definitions
 *
 * Simplified category-based service selection for booking flow.
 * Each category represents a high-level service type that customers select
 * before choosing specific service details with their stylist.
 */

export interface BookingCategory {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceNote?: string; // Optional price information (e.g., for Haircut)
  estimatedDuration: number; // Minutes, for time slot calculation
  sortOrder: number;
}

export const BOOKING_CATEGORIES: BookingCategory[] = [
  {
    id: 'haircut',
    slug: 'haircut',
    title: 'Haircut',
    description: 'Professional haircuts and styling',
    priceNote: 'From $20 (price varies by gender/age)',
    estimatedDuration: 30,
    sortOrder: 1,
  },
  {
    id: 'colouring',
    slug: 'hair-colouring',
    title: 'Colouring',
    description: 'Full color, highlights, root touch-ups',
    estimatedDuration: 120,
    sortOrder: 2,
  },
  {
    id: 'rebonding',
    slug: 'hair-rebonding',
    title: 'Rebonding',
    description: 'Hair straightening and rebonding treatments',
    estimatedDuration: 180,
    sortOrder: 3,
  },
  {
    id: 'scalp-treatment',
    slug: 'scalp-treatment',
    title: 'Scalp Treatment',
    description: 'Scalp care and treatment services',
    estimatedDuration: 60,
    sortOrder: 4,
  },
  {
    id: 'keratin-treatment',
    slug: 'keratin-treatment',
    title: 'Keratin Treatment',
    description: 'Smoothing and nourishing keratin treatments',
    estimatedDuration: 120,
    sortOrder: 5,
  },
  {
    id: 'perm',
    slug: 'hair-perm',
    title: 'Perm',
    description: 'Hair perming and wave treatments',
    estimatedDuration: 150,
    sortOrder: 6,
  },
];

/**
 * Get category by slug (e.g., 'hair-colouring' from navigation links)
 */
export function getCategoryBySlug(slug: string): BookingCategory | undefined {
  return BOOKING_CATEGORIES.find(cat => cat.slug === slug);
}

/**
 * Get category by ID
 */
export function getCategoryById(id: string): BookingCategory | undefined {
  return BOOKING_CATEGORIES.find(cat => cat.id === id);
}

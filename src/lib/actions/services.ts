'use server';

import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { Service, ServiceCategory } from '@/types';

// Cache tag constants (must match database.ts)
const CACHE_TAGS = {
  SERVICE_CATEGORIES: 'service-categories',
  SERVICES: 'services',
  SERVICE_BY_ID: (id: string) => `service-${id}`,
  CATEGORY_BY_ID: (id: string) => `category-${id}`,
  SERVICE_TAGS: 'service-tags',
} as const;

/**
 * Update a service and revalidate affected caches
 */
export async function updateService(
  serviceId: string,
  updates: Partial<Omit<Service, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>>,
) {
  try {
    // Update database
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: updates.name,
        subtitle: updates.subtitle,
        description: updates.description,
        price: updates.price,
        basePrice: updates.basePrice,
        maxPrice: updates.maxPrice,
        duration: updates.duration,
        isActive: updates.isActive,
        imageUrl: updates.imageUrl,
        popularityScore: updates.popularityScore,
        tags: updates.tags,
      },
    });

    // Revalidate caches
    revalidateTag(CACHE_TAGS.SERVICES); // All services list
    revalidateTag(CACHE_TAGS.SERVICE_BY_ID(serviceId)); // This specific service
    revalidateTag(CACHE_TAGS.SERVICE_CATEGORIES); // Categories (includes nested services)

    console.log(`[Revalidation] Service ${serviceId} updated, tags invalidated`);

    return { success: true, service: updatedService };
  } catch (error) {
    console.error('Failed to update service:', error);
    throw new Error('Failed to update service');
  }
}

/**
 * Update a service category and revalidate affected caches
 */
export async function updateServiceCategory(
  categoryId: string,
  updates: Partial<Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt' | 'items'>>,
) {
  try {
    // Update database
    const updatedCategory = await prisma.serviceCategory.update({
      where: { id: categoryId },
      data: {
        title: updates.title,
        shortTitle: updates.shortTitle,
        slug: updates.slug,
        description: updates.description,
        priceRangeMin: updates.priceRangeMin,
        priceRangeMax: updates.priceRangeMax,
        estimatedDuration: updates.estimatedDuration,
        priceNote: updates.priceNote,
        sortOrder: updates.sortOrder,
        isFeatured: updates.isFeatured,
        imageUrl: updates.imageUrl,
        illustrationUrl: updates.illustrationUrl,
        icon: updates.icon,
      },
    });

    // Revalidate caches
    revalidateTag(CACHE_TAGS.SERVICE_CATEGORIES); // All categories
    revalidateTag(CACHE_TAGS.CATEGORY_BY_ID(categoryId)); // This specific category

    console.log(`[Revalidation] Category ${categoryId} updated, tags invalidated`);

    return { success: true, category: updatedCategory };
  } catch (error) {
    console.error('Failed to update category:', error);
    throw new Error('Failed to update category');
  }
}

/**
 * Create a new service
 */
export async function createService(data: {
  name: string;
  categoryId: string;
  price: string;
  basePrice: number;
  duration: number;
  subtitle?: string;
  description?: string;
  maxPrice?: number;
}) {
  try {
    const newService = await prisma.service.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        price: data.price,
        basePrice: data.basePrice,
        duration: data.duration,
        subtitle: data.subtitle,
        description: data.description,
        maxPrice: data.maxPrice,
        isActive: true,
        popularityScore: 0,
        tags: [],
      },
    });

    // Revalidate caches
    revalidateTag(CACHE_TAGS.SERVICES);
    revalidateTag(CACHE_TAGS.SERVICE_CATEGORIES);

    console.log(`[Revalidation] New service created, caches invalidated`);

    return { success: true, service: newService };
  } catch (error) {
    console.error('Failed to create service:', error);
    throw new Error('Failed to create service');
  }
}

/**
 * Delete (deactivate) a service
 */
export async function deleteService(serviceId: string) {
  try {
    // Soft delete: set isActive to false
    await prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });

    // Revalidate caches
    revalidateTag(CACHE_TAGS.SERVICES);
    revalidateTag(CACHE_TAGS.SERVICE_BY_ID(serviceId));
    revalidateTag(CACHE_TAGS.SERVICE_CATEGORIES);

    console.log(`[Revalidation] Service ${serviceId} deleted, caches invalidated`);

    return { success: true };
  } catch (error) {
    console.error('Failed to delete service:', error);
    throw new Error('Failed to delete service');
  }
}

/**
 * Update service tags and revalidate
 */
export async function updateServiceTags(serviceId: string, tagIds: string[]) {
  try {
    // Delete existing tag relations
    await prisma.serviceTagRelation.deleteMany({
      where: { serviceId },
    });

    // Create new tag relations
    if (tagIds.length > 0) {
      await prisma.serviceTagRelation.createMany({
        data: tagIds.map(tagId => ({
          serviceId,
          tagId,
        })),
      });
    }

    // Revalidate caches
    revalidateTag(CACHE_TAGS.SERVICES);
    revalidateTag(CACHE_TAGS.SERVICE_BY_ID(serviceId));
    revalidateTag(CACHE_TAGS.SERVICE_CATEGORIES);

    console.log(`[Revalidation] Service ${serviceId} tags updated, caches invalidated`);

    return { success: true };
  } catch (error) {
    console.error('Failed to update service tags:', error);
    throw new Error('Failed to update service tags');
  }
}

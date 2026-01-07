'use server';

import { revalidateTag } from 'next/cache';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
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
    const db = await getDb();

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.basePrice !== undefined) updateData.basePrice = updates.basePrice;
    if (updates.maxPrice !== undefined) updateData.maxPrice = updates.maxPrice;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
    if (updates.popularityScore !== undefined) updateData.popularityScore = updates.popularityScore;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    const result = await db
      .update(schema.services)
      .set(updateData)
      .where(eq(schema.services.id, serviceId))
      .returning();

    // Revalidate caches
    revalidateTag(CACHE_TAGS.SERVICES);
    revalidateTag(CACHE_TAGS.SERVICE_BY_ID(serviceId));
    revalidateTag(CACHE_TAGS.SERVICE_CATEGORIES);

    console.log(`[Revalidation] Service ${serviceId} updated, tags invalidated`);

    return { success: true, service: result[0] };
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
    const db = await getDb();

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.shortTitle !== undefined) updateData.shortTitle = updates.shortTitle;
    if (updates.slug !== undefined) updateData.slug = updates.slug;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.priceRangeMin !== undefined) updateData.priceRangeMin = updates.priceRangeMin;
    if (updates.priceRangeMax !== undefined) updateData.priceRangeMax = updates.priceRangeMax;
    if (updates.estimatedDuration !== undefined)
      updateData.estimatedDuration = updates.estimatedDuration;
    if (updates.priceNote !== undefined) updateData.priceNote = updates.priceNote;
    if (updates.sortOrder !== undefined) updateData.sortOrder = updates.sortOrder;
    if (updates.isFeatured !== undefined) updateData.isFeatured = updates.isFeatured;
    if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
    if (updates.illustrationUrl !== undefined) updateData.illustrationUrl = updates.illustrationUrl;
    if (updates.icon !== undefined) updateData.icon = updates.icon;

    const result = await db
      .update(schema.serviceCategories)
      .set(updateData)
      .where(eq(schema.serviceCategories.id, categoryId))
      .returning();

    // Revalidate caches
    revalidateTag(CACHE_TAGS.SERVICE_CATEGORIES);
    revalidateTag(CACHE_TAGS.CATEGORY_BY_ID(categoryId));

    console.log(`[Revalidation] Category ${categoryId} updated, tags invalidated`);

    return { success: true, category: result[0] };
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
  description?: string;
  maxPrice?: number;
}) {
  try {
    const db = await getDb();

    const result = await db
      .insert(schema.services)
      .values({
        name: data.name,
        categoryId: data.categoryId,
        price: data.price,
        basePrice: data.basePrice,
        duration: data.duration,
        description: data.description,
        maxPrice: data.maxPrice,
        isActive: true,
        popularityScore: 0,
        tags: [],
      })
      .returning();

    // Revalidate caches
    revalidateTag(CACHE_TAGS.SERVICES);
    revalidateTag(CACHE_TAGS.SERVICE_CATEGORIES);

    console.log(`[Revalidation] New service created, caches invalidated`);

    return { success: true, service: result[0] };
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
    const db = await getDb();

    // Delete associated tag relations first
    await db
      .delete(schema.serviceTagRelations)
      .where(eq(schema.serviceTagRelations.serviceId, serviceId));

    // Delete associated addons
    await db.delete(schema.serviceAddons).where(eq(schema.serviceAddons.serviceId, serviceId));

    // Delete the service itself (hard delete)
    await db.delete(schema.services).where(eq(schema.services.id, serviceId));

    // Revalidate caches
    revalidateTag(CACHE_TAGS.SERVICES);
    revalidateTag(CACHE_TAGS.SERVICE_CATEGORIES);
    revalidateTag(CACHE_TAGS.SERVICE_BY_ID(serviceId));

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
    const db = await getDb();

    // Delete existing tag relations
    await db
      .delete(schema.serviceTagRelations)
      .where(eq(schema.serviceTagRelations.serviceId, serviceId));

    // Create new tag relations
    if (tagIds.length > 0) {
      await db
        .insert(schema.serviceTagRelations)
        .values(tagIds.map(tagId => ({ serviceId, tagId })));
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

/**
 * Create a new addon for a service
 */
export async function createAddon(data: {
  serviceId: string;
  name: string;
  price: string;
  basePrice: number;
  description?: string;
  duration?: number;
}) {
  try {
    const db = await getDb();

    const result = await db
      .insert(schema.serviceAddons)
      .values({
        serviceId: data.serviceId,
        name: data.name,
        price: data.price,
        basePrice: data.basePrice,
        description: data.description || null,
        duration: data.duration || 0,
        benefits: [],
        isRecommended: false,
        isPopular: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Revalidate caches
    revalidateTag(CACHE_TAGS.SERVICES);
    revalidateTag(CACHE_TAGS.SERVICE_CATEGORIES);

    console.log(`[Revalidation] New addon created, caches invalidated`);

    return { success: true, addon: result[0] };
  } catch (error) {
    console.error('Failed to create addon:', error);
    throw new Error('Failed to create addon');
  }
}

/**
 * Update an addon
 */
export async function updateAddon(
  addonId: string,
  updates: {
    name?: string;
    description?: string;
    price?: string;
    basePrice?: number;
    duration?: number;
  },
) {
  try {
    const db = await getDb();

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.basePrice !== undefined) updateData.basePrice = updates.basePrice;
    if (updates.duration !== undefined) updateData.duration = updates.duration;

    const result = await db
      .update(schema.serviceAddons)
      .set(updateData)
      .where(eq(schema.serviceAddons.id, addonId))
      .returning();

    // Revalidate caches
    revalidateTag(CACHE_TAGS.SERVICES);
    revalidateTag(CACHE_TAGS.SERVICE_CATEGORIES);

    console.log(`[Revalidation] Addon ${addonId} updated, caches invalidated`);

    return { success: true, addon: result[0] };
  } catch (error) {
    console.error('Failed to update addon:', error);
    throw new Error('Failed to update addon');
  }
}

/**
 * Delete an addon
 */
export async function deleteAddon(addonId: string) {
  try {
    const db = await getDb();

    await db.delete(schema.serviceAddons).where(eq(schema.serviceAddons.id, addonId));

    // Revalidate caches
    revalidateTag(CACHE_TAGS.SERVICES);
    revalidateTag(CACHE_TAGS.SERVICE_CATEGORIES);

    console.log(`[Revalidation] Addon ${addonId} deleted, caches invalidated`);

    return { success: true };
  } catch (error) {
    console.error('Failed to delete addon:', error);
    throw new Error('Failed to delete addon');
  }
}

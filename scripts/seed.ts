/**
 * Database Seed Script - Drizzle ORM Version
 *
 * Seeds the database with service categories, services, addons, and tags.
 * Run with: npx ts-node scripts/seed.ts
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { pgTable, pgEnum, text, integer, boolean, timestamp, json } from 'drizzle-orm/pg-core';
import { ALL_SERVICE_TAGS } from '../src/data/serviceTaxonomy';

// Inline schema for standalone usage (no import from src/db/schema to avoid bundling issues)
const tagCategoryEnum = pgEnum('TagCategory', ['CONCERN', 'OUTCOME', 'HAIR_TYPE']);

const serviceCategories = pgTable('service_categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  shortTitle: text('shortTitle'),
  description: text('description'),
  icon: text('icon'),
  priceRangeMin: integer('priceRangeMin'),
  priceRangeMax: integer('priceRangeMax'),
  priceNote: text('priceNote'),
  estimatedDuration: integer('estimatedDuration'),
  sortOrder: integer('sortOrder').default(0).notNull(),
  isFeatured: boolean('isFeatured').default(false).notNull(),
  imageUrl: text('imageUrl'),
  illustrationUrl: text('illustrationUrl'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

const services = pgTable('services', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  price: text('price').notNull(),
  basePrice: integer('basePrice').notNull(),
  maxPrice: integer('maxPrice'),
  duration: integer('duration').notNull(),
  processingWaitTime: integer('processingWaitTime').default(0).notNull(),
  processingDuration: integer('processingDuration').default(0).notNull(),
  imageUrl: text('imageUrl'),
  popularityScore: integer('popularityScore').default(0).notNull(),
  tags: json('tags').$type<string[]>().default([]),
  categoryId: text('categoryId').notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

const serviceAddons = pgTable('service_addons', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  benefits: json('benefits').$type<string[]>().default([]),
  price: text('price').notNull(),
  basePrice: integer('basePrice').notNull(),
  duration: integer('duration').default(0).notNull(),
  isRecommended: boolean('isRecommended').default(false).notNull(),
  isPopular: boolean('isPopular').default(false).notNull(),
  serviceId: text('serviceId').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

const serviceTags = pgTable('service_tags', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  label: text('label').notNull(),
  category: tagCategoryEnum('category').notNull(),
  description: text('description'),
  iconName: text('iconName'),
  sortOrder: integer('sortOrder').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

const serviceTagRelations = pgTable('service_tag_relations', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  serviceId: text('serviceId').notNull(),
  tagId: text('tagId').notNull(),
});

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql);

/**
 * SINGLE SOURCE OF TRUTH FOR SERVICE CATEGORIES
 */
const CATEGORIES = [
  {
    id: 'haircut',
    slug: 'haircut',
    title: 'Haircut',
    shortTitle: 'Haircut',
    description: 'Professional haircuts and styling',
    priceNote: 'From $20 (price varies by gender/age)',
    estimatedDuration: 30,
    icon: 'scissors',
    priceRangeMin: 10,
    priceRangeMax: 50,
    sortOrder: 1,
    isFeatured: false,
    items: [
      {
        name: "Women's Haircut",
        description: 'Classic cut tailored for women',
        price: '$40',
        basePrice: 40,
        duration: 45,
        serviceTags: ['split-ends', 'unruly-hair', 'manageable-hair'],
        addons: [
          {
            name: 'Wash & Blow Dry',
            description: 'Gentle cleanse and professional blow-dry for a polished finish',
            price: '$5',
            basePrice: 5,
            duration: 15,
          },
        ],
      },
      {
        name: "Men's Haircut",
        description: 'Precision cut tailored for men',
        price: '$30',
        basePrice: 30,
        duration: 45,
        serviceTags: ['unruly-hair', 'manageable-hair'],
        addons: [
          {
            name: 'Wash & Blow Dry',
            description: 'Gentle cleanse and professional blow-dry for a polished finish',
            price: '+$5',
            basePrice: 5,
            duration: 15,
          },
        ],
      },
      {
        name: "Kids' Haircut (Boys)",
        description: 'For children 12 and under',
        price: '$20',
        basePrice: 20,
        duration: 30,
        serviceTags: ['manageable-hair'],
        addons: [{ name: 'Wash & Blow Dry', basePrice: 3, duration: 15 }],
      },
      {
        name: "Kids' Haircut (Girls)",
        description: 'For children 12 and under',
        price: '$25',
        basePrice: 25,
        duration: 45,
        serviceTags: ['manageable-hair'],
        addons: [
          {
            name: 'Wash & Blow Dry',
            description: 'Gentle cleansing and quick dry',
            basePrice: 3,
            duration: 15,
          },
        ],
      },
      {
        name: 'Fringe Trim',
        description: 'Perfect shape-up for your bangs or fringe',
        price: '$10',
        basePrice: 10,
        duration: 15,
        serviceTags: ['manageable-hair'],
      },
      {
        name: 'Hair Straightening',
        description: 'Professional heat styling for temporarily straightened hair',
        price: '$10',
        basePrice: 10,
        duration: 15,
        serviceTags: ['frizzy-hair', 'naturally-curly', 'straight-hair', 'smooth-hair'],
      },
      {
        name: 'Special Occasion Styling',
        description: 'Elegant updos and special styling for weddings, parties, and events',
        price: 'From $50',
        basePrice: 50,
        maxPrice: 100,
        duration: 45,
        serviceTags: ['manageable-hair'],
      },
    ],
  },
  {
    id: 'colouring',
    slug: 'hair-colouring',
    title: 'Hair Colouring',
    shortTitle: 'Colouring',
    description: 'Full color, highlights, root touch-ups',
    estimatedDuration: 120,
    icon: 'palette',
    priceRangeMin: 70,
    priceRangeMax: 200,
    sortOrder: 2,
    isFeatured: true,
    imageUrl: '/images/background-images/hair-colouring.jpg',
    illustrationUrl: '/images/illustrations/hair-colouring.png',
    items: [
      {
        name: "Men's Full Head Colouring",
        description: 'Premium less-ammonia formulas from Japan',
        price: '$80',
        basePrice: 80,
        duration: 120,
        processingWaitTime: 45,
        processingDuration: 45,
        imageUrl: '/images/background-images/hair-colouring.jpg',
        serviceTags: ['gray-hair', 'dull-hair', 'color-change'],
        addons: [
          {
            name: 'Ammonia-Free Upgrade',
            description: 'Gentler Inoa formula on hair and scalp',
            benefits: ['Better moisture retention', 'Less odor'],
            price: '+$15',
            basePrice: 15,
            duration: 0,
          },
        ],
      },
      {
        name: "Women's Full Head Colouring",
        description: 'Premium less-ammonia formulas from Japan',
        price: 'From $95',
        basePrice: 95,
        maxPrice: 150,
        duration: 120,
        processingWaitTime: 45,
        processingDuration: 45,
        imageUrl: '/images/background-images/hair-colouring.jpg',
        serviceTags: ['gray-hair', 'dull-hair', 'color-change'],
        addons: [
          {
            name: 'Ammonia-Free Upgrade',
            description: 'Gentler Inoa formula on hair and scalp',
            benefits: ['Better moisture retention', 'Less odor'],
            price: '+$15',
            basePrice: 15,
            duration: 0,
          },
        ],
      },
      {
        name: 'Root Touch-Up',
        description:
          'Precise color application for roots using gentle, low-ammonia Japanese formula',
        price: 'From $70',
        basePrice: 70,
        maxPrice: 105,
        duration: 90,
        serviceTags: ['gray-hair', 'color-change'],
        addons: [
          {
            name: 'Ammonia-Free Upgrade',
            description: 'Gentler Inoa formula on hair and scalp',
            benefits: ['Better moisture retention', 'Less odor'],
            price: '+$15',
            basePrice: 15,
            duration: 0,
          },
        ],
      },
      {
        name: 'Highlight',
        description:
          'Dimensional color accents. Strategic highlighting for natural-looking dimension and brightness',
        price: 'From $115',
        basePrice: 115,
        maxPrice: 190,
        duration: 150,
        processingWaitTime: 60,
        processingDuration: 30,
        serviceTags: ['dull-hair', 'color-change', 'shiny-hair'],
      },
      {
        name: 'Premium Highlighting',
        description:
          'Advanced highlighting technique. Specialized highlighting service for Caucasian or thick hair textures',
        price: 'From $135',
        basePrice: 135,
        maxPrice: 200,
        duration: 180,
        processingWaitTime: 60,
        processingDuration: 45,
        serviceTags: ['dull-hair', 'color-change', 'caucasian-hair', 'thick-hair'],
      },
      {
        name: 'Bleaching Service',
        description:
          'Lightening for bold transformations. Professional bleaching for platinum, pastel, or vibrant color transformations',
        price: 'From $85',
        basePrice: 85,
        maxPrice: 180,
        duration: 120,
        processingWaitTime: 30,
        processingDuration: 45,
        serviceTags: ['color-change'],
      },
    ],
  },
  {
    id: 'rebonding',
    slug: 'hair-rebonding',
    title: 'Hair Rebonding',
    shortTitle: 'Rebonding',
    description: 'Hair straightening and rebonding treatments',
    estimatedDuration: 180,
    icon: 'move-horizontal',
    priceRangeMin: 70,
    priceRangeMax: 300,
    sortOrder: 3,
    isFeatured: true,
    imageUrl: '/images/background-images/hair-rebonding.jpg',
    illustrationUrl: '/images/illustrations/hair-rebonding.png',
    items: [
      {
        name: 'Hair Rebonding',
        description:
          'Achieve sleek, pin-straight hair. Eliminate frizz completely and enjoy smooth, glossy hair with minimal daily styling',
        price: 'From $200',
        basePrice: 200,
        maxPrice: 300,
        duration: 180,
        processingWaitTime: 45,
        processingDuration: 45,
        imageUrl: '/images/background-images/hair-rebonding.jpg',
        serviceTags: [
          'frizzy-hair',
          'naturally-curly',
          'unruly-hair',
          'straight-hair',
          'smooth-hair',
          'low-maintenance',
          'long-lasting',
          'curly-hair-type',
          'thick-hair',
        ],
        addons: [
          {
            name: 'Premium Formula Upgrade',
            description: 'Shiseido or Mucota treatment for enhanced results',
            benefits: ['Superior smoothness', 'Better hair health', 'Longer-lasting results'],
            price: '+$50',
            basePrice: 50,
            duration: 0,
          },
        ],
      },
      {
        name: 'Root Rebonding',
        description: 'Straighten new growth to match previously rebonded hair',
        price: 'From $150',
        basePrice: 150,
        maxPrice: 230,
        duration: 150,
        processingWaitTime: 30,
        processingDuration: 30,
        serviceTags: ['frizzy-hair', 'straight-hair', 'smooth-hair'],
      },
      {
        name: 'Fringe Rebonding',
        description: 'Smooth, straight fringe for a polished look',
        price: 'From $70',
        basePrice: 70,
        maxPrice: 90,
        duration: 60,
        serviceTags: ['frizzy-hair', 'straight-hair', 'smooth-hair'],
      },
    ],
  },
  {
    id: 'scalp-treatment',
    slug: 'scalp-treatment',
    title: 'Scalp Treatment',
    shortTitle: 'Scalp Treatment',
    description: 'Scalp care and treatment services',
    estimatedDuration: 60,
    icon: 'droplet',
    priceRangeMin: 55,
    priceRangeMax: 95,
    sortOrder: 4,
    isFeatured: true,
    imageUrl: '/images/background-images/scalp-treatment.png',
    illustrationUrl: '/images/illustrations/scalp-treatment.png',
    items: [
      {
        name: 'Scalp Treatment',
        description: 'Cleanse, balance, and nourish your scalp for optimal hair health',
        price: '$55',
        basePrice: 55,
        duration: 60,
        imageUrl: '/images/background-images/scalp-treatment.png',
        serviceTags: ['oily-scalp', 'dry-hair', 'clean-scalp', 'healthy-hair'],
      },
      {
        name: 'Scalp Therapy for peeling, hair loss, oily scalp, or dandruff',
        description: 'Specialized scalp treatment using formulas from Paris',
        price: '$95',
        basePrice: 95,
        duration: 75,
        serviceTags: ['dandruff', 'hair-loss', 'oily-scalp', 'clean-scalp', 'healthy-hair'],
        addons: [
          {
            name: 'Treatment Ampoule Boost',
            description: 'Concentrated treatment ampoule for enhanced scalp health',
            benefits: ['Intensive nourishment', 'Accelerated results', 'Targeted scalp repair'],
            price: '+$25',
            basePrice: 25,
            duration: 10,
          },
        ],
      },
    ],
  },
  {
    id: 'keratin-treatment',
    slug: 'keratin-treatment',
    title: 'Keratin Treatment',
    shortTitle: 'Keratin Treatment',
    description: 'Smoothing and nourishing keratin treatments',
    estimatedDuration: 120,
    icon: 'sparkles',
    priceRangeMin: 35,
    priceRangeMax: 350,
    sortOrder: 5,
    isFeatured: true,
    imageUrl: '/images/background-images/keratin-treatment.png',
    illustrationUrl: '/images/illustrations/keratin-treatment.png',
    items: [
      {
        name: 'Essential Hair Treatment',
        description:
          'Nourishing hair care. Restorative treatment to hydrate and strengthen normal to mildly damaged hair',
        price: 'From $35',
        basePrice: 35,
        maxPrice: 55,
        duration: 45,
        serviceTags: ['dry-hair', 'damaged-hair', 'healthy-hair', 'shiny-hair'],
      },
      {
        name: 'Shiseido Treatment',
        description: 'Premium Japanese treatment system for deep repair and lasting smoothness',
        price: 'From $105',
        basePrice: 105,
        maxPrice: 180,
        duration: 90,
        serviceTags: [
          'damaged-hair',
          'dry-hair',
          'frizzy-hair',
          'healthy-hair',
          'smooth-hair',
          'shiny-hair',
        ],
      },
      {
        name: 'Mucota Treatment',
        description:
          'Premium Japanese treatment for severely damaged hair - intensive repair and reconstruction',
        price: 'From $150',
        basePrice: 150,
        maxPrice: 230,
        duration: 90,
        serviceTags: [
          'damaged-hair',
          'dry-hair',
          'split-ends',
          'dull-hair',
          'healthy-hair',
          'shiny-hair',
        ],
      },
      {
        name: 'K-Gloss Keratin Treatment',
        description: 'Frizz control smoothing using USA formula',
        price: 'From $220',
        basePrice: 220,
        maxPrice: 300,
        duration: 120,
        processingWaitTime: 30,
        processingDuration: 30,
        imageUrl: '/images/background-images/keratin-treatment.png',
        serviceTags: [
          'frizzy-hair',
          'unruly-hair',
          'damaged-hair',
          'smooth-hair',
          'shiny-hair',
          'manageable-hair',
          'thick-hair',
          'curly-hair-type',
        ],
      },
      {
        name: 'Tiboli Keratin Treatment',
        description: 'Premium smoothing and shine using USA formula',
        price: 'From $280',
        basePrice: 280,
        maxPrice: 350,
        duration: 150,
        processingWaitTime: 45,
        processingDuration: 30,
        serviceTags: [
          'frizzy-hair',
          'unruly-hair',
          'damaged-hair',
          'smooth-hair',
          'shiny-hair',
          'thick-hair',
        ],
      },
    ],
  },
  {
    id: 'perm',
    slug: 'hair-perm',
    title: 'Hair Perm',
    shortTitle: 'Perm',
    description: 'Hair perming and wave treatments',
    estimatedDuration: 150,
    icon: 'waves',
    priceRangeMin: 70,
    priceRangeMax: 300,
    sortOrder: 6,
    isFeatured: true,
    imageUrl: '/images/background-images/hair-perm.jpg',
    illustrationUrl: '/images/illustrations/hair-perm.png',
    items: [
      {
        name: 'Classic Perm',
        description:
          'Traditional curls and waves. Beautiful, bouncy curls using premium Korean formula for lasting results',
        price: 'From $150',
        basePrice: 150,
        maxPrice: 180,
        duration: 150,
        processingWaitTime: 45,
        processingDuration: 30,
        imageUrl: '/images/background-images/hair-perm.jpg',
        serviceTags: ['flat-hair', 'curly-hair', 'add-volume', 'long-lasting'],
      },
      {
        name: 'Digital Perm',
        description:
          'Traditional curls and waves. Beautiful, bouncy curls using premium Korean formula for lasting results',
        price: 'From $200',
        basePrice: 200,
        maxPrice: 300,
        duration: 150,
        processingWaitTime: 60,
        processingDuration: 30,
        serviceTags: ['flat-hair', 'curly-hair', 'add-volume', 'long-lasting'],
      },
      {
        name: 'Iron Root Perm',
        description: 'Lift and volume at roots for fuller-looking hair',
        price: 'From $150',
        basePrice: 150,
        maxPrice: 180,
        duration: 120,
        processingWaitTime: 30,
        processingDuration: 30,
        serviceTags: [
          'flat-hair',
          'oily-scalp',
          'add-volume',
          'fine-hair',
          'asian-hair',
          'long-lasting',
        ],
      },
      {
        name: 'Fringe Perm',
        description: 'Soft curl and volume for fringe',
        price: 'From $70',
        basePrice: 70,
        duration: 60,
        serviceTags: ['flat-hair', 'add-volume', 'curly-hair'],
      },
      {
        name: 'Down Perm',
        description: 'Smooths and tames unruly sides for a polished look',
        price: 'From $70',
        basePrice: 70,
        duration: 60,
        serviceTags: ['unruly-hair', 'smooth-hair', 'manageable-hair'],
      },
    ],
  },
];

async function main() {
  console.log('Start seeding...');

  // Clear existing data (reverse order of dependencies)
  console.log('Clearing existing data...');
  await db.delete(serviceTagRelations);
  await db.delete(serviceTags);
  await db.delete(serviceAddons);
  await db.delete(services);
  await db.delete(serviceCategories);

  // Create service tags from taxonomy
  console.log('Creating service tags...');
  const createdTags: Record<string, { id: string }> = {};
  for (const tag of ALL_SERVICE_TAGS) {
    const result = await db
      .insert(serviceTags)
      .values({
        slug: tag.slug,
        label: tag.label,
        category: tag.category as 'CONCERN' | 'OUTCOME' | 'HAIR_TYPE',
        description: tag.description,
        iconName: tag.iconName,
        sortOrder: tag.sortOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: serviceTags.id });
    createdTags[tag.slug] = result[0];
  }
  console.log(`Created ${Object.keys(createdTags).length} tags`);

  // Create categories and services
  for (const category of CATEGORIES) {
    const categoryResult = await db
      .insert(serviceCategories)
      .values({
        slug: category.slug,
        title: category.title,
        shortTitle: (category as any).shortTitle,
        description: category.description,
        priceNote: (category as any).priceNote,
        estimatedDuration: (category as any).estimatedDuration,
        icon: category.icon,
        priceRangeMin: category.priceRangeMin,
        priceRangeMax: category.priceRangeMax,
        sortOrder: category.sortOrder,
        isFeatured: (category as any).isFeatured ?? false,
        imageUrl: (category as any).imageUrl,
        illustrationUrl: (category as any).illustrationUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: serviceCategories.id });

    const createdCategory = categoryResult[0];

    for (const item of category.items) {
      const serviceResult = await db
        .insert(services)
        .values({
          name: item.name,
          description: (item as any).description,
          price: item.price,
          basePrice: item.basePrice,
          maxPrice: (item as any).maxPrice,
          duration: item.duration,
          processingWaitTime: (item as any).processingWaitTime ?? 0,
          processingDuration: (item as any).processingDuration ?? 0,
          imageUrl: (item as any).imageUrl,
          categoryId: createdCategory.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: services.id });

      const service = serviceResult[0];

      // Create service tag relationships
      if ('serviceTags' in item && Array.isArray((item as any).serviceTags)) {
        for (const tagSlug of (item as any).serviceTags) {
          if (createdTags[tagSlug]) {
            await db.insert(serviceTagRelations).values({
              serviceId: service.id,
              tagId: createdTags[tagSlug].id,
            });
          } else {
            console.warn(`Tag not found: ${tagSlug} for service: ${item.name}`);
          }
        }
      }

      // Create addons
      if ((item as any).addons) {
        for (const addon of (item as any).addons) {
          await db.insert(serviceAddons).values({
            name: addon.name,
            description: addon.description || null,
            price: addon.price || `+$${addon.basePrice}`,
            basePrice: addon.basePrice,
            duration: addon.duration ?? 0,
            isRecommended: addon.isRecommended ?? false,
            isPopular: addon.isPopular ?? false,
            serviceId: service.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }
  }

  console.log('Seeding finished.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

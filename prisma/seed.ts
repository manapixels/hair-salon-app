import { PrismaClient } from '@prisma/client';
import { ALL_SERVICE_TAGS } from '../src/data/serviceTaxonomy';

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    id: 'cut',
    title: 'Haircuts & Styling',
    description: 'Professional cuts and styling for all hair types',
    icon: 'scissors',
    priceRangeMin: 10,
    priceRangeMax: 50,
    sortOrder: 1,
    items: [
      {
        name: "Women's Haircut",
        subtitle: 'Classic cut tailored for women',
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
        subtitle: 'Precision cut tailored for men',
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
        subtitle: 'For children 12 and under',
        price: '$20',
        basePrice: 20,
        duration: 30,
        serviceTags: ['manageable-hair'],
        addons: [
          {
            name: 'Wash & Blow Dry',
            basePrice: 3,
            duration: 15,
          },
        ],
      },
      {
        name: "Kids' Haircut (Girls)",
        subtitle: 'For children 12 and under',
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
        subtitle: 'Perfect shape-up for your bangs or fringe',
        price: '$10',
        basePrice: 10,
        duration: 15,
        serviceTags: ['manageable-hair'],
      },
      {
        name: 'Hair Straightening',
        subtitle: 'Professional heat styling for temporarily straightened hair',
        price: '$10',
        basePrice: 10,
        duration: 15,
        serviceTags: ['frizzy-hair', 'naturally-curly', 'straight-hair', 'smooth-hair'],
      },
      {
        name: 'Special Occasion Styling',
        subtitle: 'Elegant updos and special styling for weddings, parties, and events',
        price: 'From $50',
        basePrice: 50,
        maxPrice: 100,
        duration: 45,
        serviceTags: ['manageable-hair'],
      },
    ],
  },
  {
    id: 'color',
    title: 'Hair Color',
    description: 'Expert coloring with premium formulas',
    icon: 'palette',
    priceRangeMin: 70,
    priceRangeMax: 200,
    sortOrder: 2,
    items: [
      {
        name: "Men's Full Head Colouring",
        subtitle: 'Premium less-ammonia formulas from Japan',
        price: '$80',
        basePrice: 80,
        duration: 120,
        imageUrl: '/background-images/hair-colouring.jpg',
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
        subtitle: 'Premium less-ammonia formulas from Japan',
        price: 'From $95',
        basePrice: 95,
        maxPrice: 150,
        duration: 120,
        imageUrl: '/background-images/hair-colouring.jpg',
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
        subtitle: 'Precise color application for roots using gentle, low-ammonia Japanese formula',
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
        subtitle: 'Dimensional color accents',
        description: 'Strategic highlighting for natural-looking dimension and brightness',
        price: 'From $115',
        basePrice: 115,
        maxPrice: 190,
        duration: 150,
        serviceTags: ['dull-hair', 'color-change', 'shiny-hair'],
      },
      {
        name: 'Premium Highlighting',
        subtitle: 'Advanced highlighting technique',
        description: 'Specialized highlighting service for Caucasian or thick hair textures',
        price: 'From $135',
        basePrice: 135,
        maxPrice: 200,
        duration: 180,
        serviceTags: ['dull-hair', 'color-change', 'caucasian-hair', 'thick-hair'],
      },
      {
        name: 'Bleaching Service',
        subtitle: 'Lightening for bold transformations',
        description:
          'Professional bleaching for platinum, pastel, or vibrant color transformations',
        price: 'From $85',
        basePrice: 85,
        maxPrice: 180,
        duration: 120,
        serviceTags: ['color-change'],
      },
    ],
  },
  {
    id: 'perm',
    title: 'Perms & Texture',
    description: 'Long-lasting curls, waves, and smoothing',
    icon: 'waves',
    priceRangeMin: 70,
    priceRangeMax: 300,
    sortOrder: 3,
    items: [
      {
        name: 'Classic Perm',
        subtitle: 'Traditional curls and waves',
        description: 'Beautiful, bouncy curls using premium Korean formula for lasting results',
        price: 'From $150',
        basePrice: 150,
        maxPrice: 180,
        duration: 150,
        serviceTags: ['flat-hair', 'curly-hair', 'add-volume', 'long-lasting'],
      },
      {
        name: 'Digital Perm',
        subtitle: 'Traditional curls and waves',
        description: 'Beautiful, bouncy curls using premium Korean formula for lasting results',
        price: 'From $200',
        basePrice: 200,
        maxPrice: 300,
        duration: 150,
        serviceTags: ['flat-hair', 'curly-hair', 'add-volume', 'long-lasting'],
      },
      {
        name: 'Iron Root Perm',
        subtitle: 'Lift and volume at roots for fuller-looking hair',
        price: 'From $150',
        basePrice: 150,
        maxPrice: 180,
        duration: 120,
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
        subtitle: 'Soft curl and volume for fringe',
        price: 'From $70',
        basePrice: 70,
        duration: 60,
        serviceTags: ['flat-hair', 'add-volume', 'curly-hair'],
      },
      {
        name: 'Down Perm',
        subtitle: 'Smooths and tames unruly sides for a polished look',
        price: 'From $70',
        basePrice: 70,
        duration: 60,
        serviceTags: ['unruly-hair', 'smooth-hair', 'manageable-hair'],
      },
      {
        name: 'Hair Rebonding',
        subtitle:
          'Achieve sleek, pin-straight hair. Eliminate frizz completely and enjoy smooth, glossy hair with minimal daily styling',
        price: 'From $200',
        basePrice: 200,
        maxPrice: 300,
        duration: 180,
        imageUrl: '/background-images/hair-rebonding.jpg',
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
        subtitle: 'Straighten new growth to match previously rebonded hair',
        price: 'From $150',
        basePrice: 150,
        maxPrice: 230,
        duration: 150,
        serviceTags: ['frizzy-hair', 'straight-hair', 'smooth-hair'],
      },
      {
        name: 'Fringe Rebonding',
        subtitle: 'Smooth, straight fringe for a polished look',
        price: 'From $70',
        basePrice: 70,
        maxPrice: 90,
        duration: 60,
        tags: ['quick', 'styling'],
        serviceTags: ['frizzy-hair', 'straight-hair', 'smooth-hair'],
      },
    ],
  },
  {
    id: 'treatment',
    title: 'Hair Treatments',
    description: 'Repair, nourish, and restore hair health',
    icon: 'sparkles',
    priceRangeMin: 35,
    priceRangeMax: 350,
    sortOrder: 4,
    items: [
      {
        name: 'Scalp Treatment',
        subtitle: 'Cleanse, balance, and nourish your scalp for optimal hair health',
        price: '$55',
        basePrice: 55,
        duration: 60,
        imageUrl: '/background-images/hair-treatment.png',
        serviceTags: ['oily-scalp', 'dry-hair', 'clean-scalp', 'healthy-hair'],
      },
      {
        name: 'Scalp Therapy for peeling, hair loss, oily scalp, or dandruff',
        subtitle: 'Specialized scalp treatment using formulas from Paris',
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
      {
        name: 'Essential Hair Treatment',
        subtitle: 'Nourishing hair care',
        description:
          'Restorative treatment to hydrate and strengthen normal to mildly damaged hair',
        price: 'From $35',
        basePrice: 35,
        maxPrice: 55,
        duration: 45,
        serviceTags: ['dry-hair', 'damaged-hair', 'healthy-hair', 'shiny-hair'],
      },
      {
        name: 'Shiseido Treatment',
        subtitle: 'Premium Japanese treatment system for deep repair and lasting smoothness',
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
        subtitle:
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
        subtitle: 'Frizz control smoothing using USA formula',
        price: 'From $220',
        basePrice: 220,
        maxPrice: 300,
        duration: 120,
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
        subtitle: 'Premium smoothing and shine using USA formula',
        price: 'From $280',
        basePrice: 280,
        maxPrice: 350,
        duration: 150,
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
];

async function main() {
  console.log('Start seeding...');

  // Clear existing data
  await prisma.serviceTagRelation.deleteMany();
  await prisma.serviceTag.deleteMany();
  await prisma.serviceAddon.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();

  // Create service tags from taxonomy
  console.log('Creating service tags...');
  const createdTags: Record<string, { id: string }> = {};
  for (const tag of ALL_SERVICE_TAGS) {
    const created = await prisma.serviceTag.create({
      data: {
        slug: tag.slug,
        label: tag.label,
        category: tag.category,
        description: tag.description,
        iconName: tag.iconName,
        sortOrder: tag.sortOrder,
      },
    });
    createdTags[tag.slug] = created;
  }
  console.log(`Created ${Object.keys(createdTags).length} tags`);

  // Create categories and services
  for (const category of CATEGORIES) {
    const createdCategory = await prisma.serviceCategory.create({
      data: {
        title: category.title,
        description: category.description,
        icon: category.icon,
        priceRangeMin: category.priceRangeMin,
        priceRangeMax: category.priceRangeMax,
        sortOrder: category.sortOrder,
      },
    });

    for (const item of category.items) {
      const service = await prisma.service.create({
        data: {
          name: item.name,
          subtitle: item.subtitle,
          description: (item as any).description,
          price: item.price,
          basePrice: item.basePrice,
          maxPrice: (item as any).maxPrice,
          duration: item.duration,
          tags: (item as any).tags || [],
          categoryId: createdCategory.id,
        },
      });

      // Create service tag relationships
      if ('serviceTags' in item && Array.isArray((item as any).serviceTags)) {
        for (const tagSlug of (item as any).serviceTags) {
          if (createdTags[tagSlug]) {
            await prisma.serviceTagRelation.create({
              data: {
                serviceId: service.id,
                tagId: createdTags[tagSlug].id,
              },
            });
          } else {
            console.warn(`Tag not found: ${tagSlug} for service: ${item.name}`);
          }
        }
      }

      if ((item as any).addons) {
        for (const addon of (item as any).addons) {
          await prisma.serviceAddon.create({
            data: {
              name: addon.name,
              description: addon.description || null,
              benefits: addon.benefits || [],
              price: addon.price || `+$${addon.basePrice}`,
              basePrice: addon.basePrice,
              duration: addon.duration ?? 0,
              isRecommended: addon.isRecommended ?? false,
              isPopular: addon.isPopular ?? false,
              serviceId: service.id,
            },
          });
        }
      }
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

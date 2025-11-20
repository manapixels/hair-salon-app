import { PrismaClient } from '@prisma/client';

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
        subtitle: 'Classic cut with styling',
        description: 'Professional haircut tailored to your style and face shape',
        price: '$40',
        basePrice: 40,
        duration: 60,
        popularityScore: 95,
        tags: ['popular', 'classic'],
        addons: [
          {
            name: 'Wash & Blow Dry',
            description: 'Gentle cleanse and professional blow-dry for a polished finish',
            benefits: ['Longer-lasting style', 'Added shine', 'Professional finish'],
            price: '+$5',
            basePrice: 5,
            duration: 15,
            isRecommended: true,
            isPopular: true,
          },
        ],
      },
      {
        name: "Men's Haircut",
        subtitle: 'Precision cut tailored for men',
        description: 'Classic or modern cut designed to complement your features',
        price: '$30',
        basePrice: 30,
        duration: 45,
        popularityScore: 90,
        tags: ['popular', 'quick', 'budget'],
        addons: [
          {
            name: 'Wash & Blow Dry',
            description: 'Refreshing wash and professional styling',
            benefits: ['Clean, polished look', 'Styling tips included'],
            price: '+$5',
            basePrice: 5,
            duration: 10,
            isPopular: true,
          },
        ],
      },
      {
        name: "Kids' Haircut (Boys)",
        subtitle: 'For children 12 and under',
        description: 'Patient, gentle haircuts for boys in a friendly environment',
        price: '$20',
        basePrice: 20,
        duration: 30,
        popularityScore: 70,
        tags: ['kids', 'quick', 'budget'],
        addons: [
          {
            name: 'Wash & Blow Dry',
            description: 'Gentle cleansing and quick dry',
            benefits: ['Clean, comfortable finish'],
            price: '+$3',
            basePrice: 3,
            duration: 10,
          },
        ],
      },
      {
        name: "Kids' Haircut (Girls)",
        subtitle: 'For children 12 and under',
        description: 'Age-appropriate styling with patience and care',
        price: '$25',
        basePrice: 25,
        duration: 45,
        popularityScore: 70,
        tags: ['kids', 'budget'],
        addons: [
          {
            name: 'Wash & Blow Dry',
            description: 'Gentle cleansing with light styling',
            benefits: ['Soft, manageable finish'],
            price: '+$3',
            basePrice: 3,
            duration: 10,
          },
        ],
      },
      {
        name: 'Fringe Trim',
        subtitle: 'Quick bang trim',
        description: 'Perfect shape-up for your bangs or fringe',
        price: '$10',
        basePrice: 10,
        duration: 15,
        popularityScore: 60,
        tags: ['quick', 'budget', 'maintenance'],
      },
      {
        name: 'Hair Straightening',
        subtitle: 'Sleek, smooth finish',
        description: 'Professional heat styling for temporarily straightened hair',
        price: '$10',
        basePrice: 10,
        duration: 15,
        popularityScore: 50,
        tags: ['quick', 'styling'],
      },
      {
        name: 'Special Occasion Styling',
        subtitle: 'Event-ready hairstyling',
        description: 'Elegant updos and special styling for weddings, parties, and events',
        price: 'From $50',
        basePrice: 50,
        maxPrice: 100,
        duration: 45,
        popularityScore: 65,
        tags: ['premium', 'special'],
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
        name: 'Hair Colouring',
        subtitle: 'Professional full-head color transformation',
        description:
          'Transform your look with our professional hair coloring service using premium low-ammonia formulas from Japan. Expert application ensures vibrant, long-lasting color customized to your hair type and desired outcome.',
        price: 'From $95',
        basePrice: 95,
        maxPrice: 150,
        duration: 120,
        imageUrl:
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200&auto=format&fit=crop',
        popularityScore: 85,
        tags: ['popular', 'color', 'transformation'],
        addons: [
          {
            name: 'Color Gloss Treatment',
            description: 'Adds shine and seals in color for longer-lasting vibrancy',
            benefits: ['Enhanced shine', 'Color protection', 'Smoother texture'],
            price: '+$20',
            basePrice: 20,
            duration: 15,
            isRecommended: true,
            isPopular: true,
          },
          {
            name: 'Ammonia-Free Upgrade',
            description: 'Gentler Inoa formula for sensitive scalps',
            benefits: ['Gentler on hair and scalp', 'Better moisture retention', 'Less odor'],
            price: '+$15',
            basePrice: 15,
            duration: 0,
            isRecommended: false,
            isPopular: false,
          },
        ],
      },
      {
        name: 'Balayage',
        subtitle: 'Hand-painted sun-kissed highlights',
        description:
          'Experience the art of balayage - a sophisticated hand-painting technique that creates natural, sun-kissed highlights with seamless dimension. Perfect for a low-maintenance, lived-in look that grows out beautifully.',
        price: 'From $150',
        basePrice: 150,
        maxPrice: 220,
        duration: 180,
        imageUrl:
          'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?q=80&w=1200&auto=format&fit=crop',
        popularityScore: 95,
        tags: ['popular', 'premium', 'color', 'balayage'],
        addons: [
          {
            name: 'Toning Treatment',
            description: 'Custom toner to perfect your blonde shade and eliminate brassiness',
            benefits: ['Neutralizes unwanted tones', 'Customized shade', 'Enhanced vibrancy'],
            price: '+$25',
            basePrice: 25,
            duration: 20,
            isRecommended: true,
            isPopular: true,
          },
          {
            name: 'Olaplex Bond Treatment',
            description: 'Protect and strengthen hair during lightening process',
            benefits: ['Reduces damage', 'Stronger hair', 'Better color results'],
            price: '+$35',
            basePrice: 35,
            duration: 0,
            isRecommended: true,
            isPopular: false,
          },
        ],
      },
      {
        name: 'Root Touch-Up',
        subtitle: 'Cover grays and regrowth',
        description:
          'Precise color application for roots using gentle, low-ammonia Japanese formula',
        price: 'From $70',
        basePrice: 70,
        maxPrice: 105,
        duration: 90,
        popularityScore: 85,
        tags: ['popular', 'maintenance', 'color'],
        addons: [
          {
            name: 'Ammonia-Free Upgrade',
            description: 'Inoa formula for extra hydration and nourishment',
            benefits: ['Gentler on hair and scalp', 'Better moisture retention', 'Less odor'],
            price: '+$15',
            basePrice: 15,
            duration: 0,
            isRecommended: true,
            isPopular: false,
          },
        ],
      },
      {
        name: "Complete Hair Color - Men's",
        subtitle: 'Full coverage for men',
        description: 'Even, natural-looking color using low-ammonia Japanese formula',
        price: '$80',
        basePrice: 80,
        duration: 90,
        popularityScore: 60,
        tags: ['color'],
      },
      {
        name: 'Highlight',
        subtitle: 'Dimensional color accents',
        description: 'Strategic highlighting for natural-looking dimension and brightness',
        price: 'From $115',
        basePrice: 115,
        maxPrice: 190,
        duration: 150,
        popularityScore: 90,
        tags: ['popular', 'premium', 'color'],
      },
      {
        name: 'Premium Highlighting',
        subtitle: 'Advanced highlighting technique',
        description: 'Specialized highlighting service for Caucasian or thick hair textures',
        price: 'From $135',
        basePrice: 135,
        maxPrice: 200,
        duration: 180,
        popularityScore: 70,
        tags: ['premium', 'color'],
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
        popularityScore: 75,
        tags: ['bold', 'color', 'transformation'],
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
        name: 'Hair Perm',
        subtitle: 'Long-lasting curls and waves',
        description:
          'Transform straight hair into beautiful curls, waves, or added volume with our professional perm service using advanced Korean formulas. From loose beachy waves to bouncy curls, we create the perfect texture for your style.',
        price: 'From $200',
        basePrice: 200,
        maxPrice: 300,
        duration: 180,
        imageUrl:
          'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=1200&auto=format&fit=crop',
        popularityScore: 85,
        tags: ['popular', 'premium', 'curls', 'transformation'],
        addons: [
          {
            name: 'Curl Defining Treatment',
            description: 'Enhanced formula for more defined, longer-lasting curls',
            benefits: ['Better curl definition', 'Longer-lasting results', 'Shinier finish'],
            price: '+$30',
            basePrice: 30,
            duration: 15,
            isRecommended: true,
            isPopular: true,
          },
          {
            name: 'Keratin Boost',
            description: 'Protein treatment to strengthen hair during perm process',
            benefits: ['Reduced damage', 'Stronger hair bonds', 'Healthier results'],
            price: '+$40',
            basePrice: 40,
            duration: 0,
            isRecommended: false,
            isPopular: false,
          },
        ],
      },
      {
        name: 'Hair Rebonding',
        subtitle: 'Permanent straightening',
        description:
          'Achieve sleek, pin-straight hair that lasts 6-8 months with our professional Japanese rebonding service. Eliminate frizz completely and enjoy smooth, glossy hair with minimal daily styling.',
        price: 'From $200',
        basePrice: 200,
        maxPrice: 300,
        duration: 180,
        imageUrl:
          'https://images.unsplash.com/photo-1487412912498-0447578fcca8?q=80&w=1200&auto=format&fit=crop',
        popularityScore: 90,
        tags: ['popular', 'straightening', 'transformation'],
        addons: [
          {
            name: 'Premium Formula Upgrade',
            description: 'Shiseido or Mucota treatment for enhanced results',
            benefits: ['Superior smoothness', 'Better hair health', 'Longer-lasting results'],
            price: '+$50',
            basePrice: 50,
            duration: 0,
            isRecommended: true,
            isPopular: true,
          },
          {
            name: 'Hydrating Treatment',
            description: 'Deep moisture infusion for silky-smooth finish',
            benefits: ['Enhanced smoothness', 'Better moisture', 'Reduced breakage'],
            price: '+$35',
            basePrice: 35,
            duration: 20,
            isRecommended: false,
            isPopular: false,
          },
        ],
      },
      {
        name: 'Classic Perm',
        subtitle: 'Traditional curls and waves',
        description: 'Beautiful, bouncy curls using premium Korean formula for lasting results',
        price: 'From $150',
        basePrice: 150,
        maxPrice: 180,
        duration: 150,
        popularityScore: 70,
        tags: ['curls', 'transformation'],
      },
      {
        name: 'Root Rebonding',
        subtitle: 'Regrowth straightening',
        description: 'Straighten new growth to match previously rebonded hair',
        price: 'From $150',
        basePrice: 150,
        maxPrice: 230,
        duration: 150,
        popularityScore: 65,
        tags: ['straightening', 'maintenance'],
      },
      {
        name: 'Volume Root Perm',
        subtitle: 'Lift and volume at roots',
        description: 'Add lasting volume and lift at the roots for fuller-looking hair',
        price: 'From $150',
        basePrice: 150,
        maxPrice: 180,
        duration: 120,
        popularityScore: 60,
        tags: ['volume'],
      },
      {
        name: 'Fringe Styling Service',
        subtitle: 'Bangs perm, rebond, or wave',
        description:
          'Specialized treatment for fringe area - add curl, straighten, or create soft waves',
        price: 'From $70',
        basePrice: 70,
        maxPrice: 90,
        duration: 60,
        popularityScore: 55,
        tags: ['quick', 'styling'],
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
        subtitle: 'Therapeutic scalp health care',
        description:
          'Comprehensive scalp care service designed to cleanse, balance, and nourish your scalp for optimal hair health. Address concerns like oiliness, dryness, dandruff, and promote healthy hair growth with specialized products and stimulating massage techniques.',
        price: '$55',
        basePrice: 55,
        duration: 60,
        imageUrl:
          'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?q=80&w=1200&auto=format&fit=crop',
        popularityScore: 75,
        tags: ['scalp', 'wellness', 'popular'],
        addons: [
          {
            name: 'Treatment Ampoule Boost',
            description: 'Concentrated treatment ampoule for enhanced scalp health',
            benefits: ['Intensive nourishment', 'Accelerated results', 'Targeted scalp repair'],
            price: '+$25',
            basePrice: 25,
            duration: 10,
            isRecommended: true,
            isPopular: true,
          },
          {
            name: 'Extended Massage',
            description: 'Additional 15 minutes of therapeutic scalp massage',
            benefits: ['Deep relaxation', 'Better circulation', 'Stress relief'],
            price: '+$15',
            basePrice: 15,
            duration: 15,
            isRecommended: false,
            isPopular: false,
          },
        ],
      },
      {
        name: 'Scalp Therapy - Advanced',
        subtitle: 'Specialized scalp treatment',
        description: 'Parisian formula for hair loss, oily scalp, dandruff, or deep scalp detox',
        price: '$95',
        basePrice: 95,
        duration: 75,
        popularityScore: 65,
        tags: ['scalp', 'therapeutic', 'premium'],
        addons: [
          {
            name: 'Treatment Ampoule Boost',
            description: 'Concentrated treatment ampoule for enhanced scalp health',
            benefits: ['Intensive nourishment', 'Accelerated results', 'Targeted scalp repair'],
            price: '+$25',
            basePrice: 25,
            duration: 10,
            isRecommended: true,
          },
        ],
      },
      {
        name: 'Hair Treatment - Essential',
        subtitle: 'Nourishing hair care',
        description:
          'Restorative treatment to hydrate and strengthen normal to mildly damaged hair',
        price: 'From $35',
        basePrice: 35,
        maxPrice: 55,
        duration: 45,
        popularityScore: 75,
        tags: ['budget', 'treatment', 'popular'],
      },
      {
        name: 'Shiseido Treatment',
        subtitle: 'Japanese luxury hair repair',
        description: 'Premium Japanese treatment system for deep repair and lasting smoothness',
        price: 'From $105',
        basePrice: 105,
        maxPrice: 180,
        duration: 90,
        popularityScore: 80,
        tags: ['popular', 'premium', 'treatment', 'japanese'],
      },
      {
        name: 'Mucota Treatment',
        subtitle: 'Ultimate Japanese restoration',
        description:
          'Top-tier Japanese treatment for severely damaged hair - intensive repair and reconstruction',
        price: 'From $150',
        basePrice: 150,
        maxPrice: 230,
        duration: 90,
        popularityScore: 75,
        tags: ['premium', 'treatment', 'japanese', 'intensive'],
      },
      {
        name: 'K-Gloss Keratin Treatment',
        subtitle: 'Frizz control smoothing',
        description: 'American keratin system for smooth, frizz-free hair with natural movement',
        price: 'From $220',
        basePrice: 220,
        maxPrice: 300,
        duration: 120,
        popularityScore: 85,
        tags: ['popular', 'premium', 'treatment', 'keratin', 'smoothing'],
      },
      {
        name: 'Tiboli Keratin Treatment',
        subtitle: 'Ultra-premium smoothing',
        description: 'Top-of-the-line American keratin treatment for maximum smoothness and shine',
        price: 'From $280',
        basePrice: 280,
        maxPrice: 350,
        duration: 150,
        popularityScore: 70,
        tags: ['premium', 'luxury', 'treatment', 'keratin', 'smoothing'],
      },
    ],
  },
];

async function main() {
  console.log('Start seeding...');

  // Clear existing data
  await prisma.serviceAddon.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();

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
          description: item.description,
          price: item.price,
          basePrice: item.basePrice,
          maxPrice: item.maxPrice,
          duration: item.duration,
          popularityScore: item.popularityScore || 0,
          tags: item.tags || [],
          categoryId: createdCategory.id,
        },
      });

      if (item.addons) {
        for (const addon of item.addons) {
          await prisma.serviceAddon.create({
            data: {
              name: addon.name,
              description: addon.description,
              benefits: addon.benefits || [],
              price: addon.price,
              basePrice: addon.basePrice,
              duration: 'duration' in addon ? addon.duration : 0,
              isRecommended: 'isRecommended' in addon ? addon.isRecommended : false,
              isPopular: 'isPopular' in addon ? addon.isPopular : false,
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

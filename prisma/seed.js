const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    id: 'cut',
    title: 'Cut',
    items: [
      {
        name: 'Women',
        price: '$40',
        basePrice: 40,
        duration: 60,
        description: '$45 if wash and blow is included',
      },
      {
        name: 'Men',
        price: '$30',
        basePrice: 30,
        duration: 45,
        description: '$35 if wash and blow is included',
      },
      {
        name: 'Kid (below 12 y/o, boy)',
        price: '$20',
        basePrice: 20,
        duration: 30,
        description: '$23 if wash and blow is included',
      },
      {
        name: 'Kid (below 12 y/o, girl)',
        price: '$25',
        basePrice: 25,
        duration: 45,
        description: '$28 if wash and blow is included',
      },
      {
        name: 'Ironing Add-on',
        price: '+$10',
        basePrice: 10,
        duration: 15,
        isAddon: true,
      },
      {
        name: 'Fringe Cut',
        price: '$10',
        basePrice: 10,
        duration: 15,
      },
      {
        name: 'Styling',
        price: '$50+',
        basePrice: 50,
        duration: 45,
      },
    ],
  },
  {
    id: 'color',
    title: 'Color',
    items: [
      {
        name: 'Roots Retouch (Less Ammonia - Japan)',
        price: '$70-105',
        basePrice: 70,
        duration: 90,
        addons: [
          {
            name: 'Inoa Ammonia Free (Hydration & Nourishment)',
            price: '+$15',
            basePrice: 15,
          },
        ],
      },
      {
        name: 'Full Head (Less Ammonia - Japan) - Men',
        price: '$80',
        basePrice: 80,
        duration: 90,
      },
      {
        name: 'Full Head (Less Ammonia - Japan) - Women',
        price: '$95-150',
        basePrice: 95,
        duration: 120,
      },
      {
        name: 'Highlight',
        price: '$115-190+',
        basePrice: 115,
        duration: 150,
      },
      {
        name: 'Caucasian Highlight',
        price: '$135-200+',
        basePrice: 135,
        duration: 180,
      },
      {
        name: 'Bleaching',
        price: '$85-180+',
        basePrice: 85,
        duration: 120,
      },
    ],
  },
  {
    id: 'perm',
    title: 'Perm',
    items: [
      {
        name: 'Regular Perm (Korean Lotion)',
        price: '$150-180+',
        basePrice: 150,
        duration: 150,
      },
      {
        name: 'Digital Perm',
        price: '$200-300+',
        basePrice: 200,
        duration: 180,
      },
      {
        name: 'Rebonding',
        price: '$200-300+',
        basePrice: 200,
        duration: 180,
        addons: [
          {
            name: 'Shiseido or Mucota Upgrade',
            price: '+$50',
            basePrice: 50,
          },
        ],
      },
      {
        name: 'Roots Rebond',
        price: '$150-230+',
        basePrice: 150,
        duration: 150,
      },
      {
        name: 'Iron Roots Perm',
        price: '$150-180+',
        basePrice: 150,
        duration: 120,
      },
      {
        name: 'Fringe Perm / Rebond / Down Perm',
        price: '$70+',
        basePrice: 70,
        duration: 60,
      },
    ],
  },
  {
    id: 'treatment',
    title: 'Hair Scale Treatment',
    items: [
      {
        name: 'Scale Treatment (Normal)',
        price: '$55',
        basePrice: 55,
        duration: 60,
      },
      {
        name: 'Peeling / Hair Loss / Oily or Dandruff (Paris)',
        price: '$95',
        basePrice: 95,
        duration: 75,
        addons: [
          {
            name: 'With Ampoule',
            price: '$120',
            basePrice: 25,
          },
        ],
      },
      {
        name: 'Hair Treatment (Normal)',
        price: '$35-55',
        basePrice: 35,
        duration: 45,
      },
      {
        name: 'Shiseido Treatment (Japan)',
        price: '$105-180+',
        basePrice: 105,
        duration: 90,
      },
      {
        name: 'Mucota Treatment (Japan)',
        price: '$150-230+',
        basePrice: 150,
        duration: 90,
      },
      {
        name: 'K-Gloss Keratin (USA)',
        price: '$220-300+',
        basePrice: 220,
        duration: 120,
      },
      {
        name: 'Tiboli Keratin (USA)',
        price: '$280-350+',
        basePrice: 280,
        duration: 150,
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
      },
    });

    for (const item of category.items) {
      const service = await prisma.service.create({
        data: {
          name: item.name,
          price: item.price,
          basePrice: item.basePrice,
          duration: item.duration,
          description: item.description,
          categoryId: createdCategory.id,
        },
      });

      if (item.addons) {
        for (const addon of item.addons) {
          await prisma.serviceAddon.create({
            data: {
              name: addon.name,
              price: addon.price,
              basePrice: addon.basePrice,
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

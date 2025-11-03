import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SALON_SERVICES = [
  {
    id: 1,
    name: "Men's Haircut",
    description: 'Classic cut and style for men.',
    price: 30,
    duration: 30,
  },
  {
    id: 2,
    name: "Women's Haircut",
    description: 'Shampoo, cut, and blow-dry.',
    price: 60,
    duration: 60,
  },
  {
    id: 3,
    name: 'Single Process Color',
    description: 'Root touch-up or all-over color.',
    price: 80,
    duration: 90,
  },
  {
    id: 4,
    name: 'Partial Highlights',
    description: 'Highlights on the top half of the head.',
    price: 120,
    duration: 120,
  },
  {
    id: 5,
    name: 'Full Highlights',
    description: 'Highlights throughout the entire head.',
    price: 180,
    duration: 180,
  },
  {
    id: 6,
    name: 'Balayage',
    description: 'Hand-painted highlights for a natural look.',
    price: 250,
    duration: 210,
  },
  {
    id: 7,
    name: 'Keratin Treatment',
    description: 'Smooth and straighten frizzy hair.',
    price: 300,
    duration: 180,
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@luxecuts.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@luxecuts.com',
      password: 'admin123',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created');

  // Create test customer
  const customer = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'CUSTOMER',
    },
  });
  console.log('✅ Test customer created');

  // Create services
  for (const service of SALON_SERVICES) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: service,
      create: service,
    });
  }
  console.log('✅ Services created');

  // Create admin settings
  await prisma.adminSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      weeklySchedule: {
        monday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
        tuesday: { isOpen: false, openingTime: '11:00', closingTime: '19:00' },
        wednesday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
        thursday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
        friday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
        saturday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
        sunday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
      },
      closedDates: [],
      blockedSlots: {},
      businessName: 'Luxe Cuts Hair Salon',
      businessAddress: '123 Main St, Your City, ST 12345',
      businessPhone: '(555) 123-4567',
    },
  });
  console.log('✅ Admin settings created');

  // Create sample appointments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const sampleAppointments = [
    {
      date: tomorrow,
      time: '10:00',
      services: [SALON_SERVICES[0], SALON_SERVICES[2]], // Men's cut + color
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      totalPrice: 110,
      totalDuration: 120,
      userId: customer.id,
    },
    {
      date: nextWeek,
      time: '14:00',
      services: [SALON_SERVICES[1]], // Women's cut
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      totalPrice: 60,
      totalDuration: 60,
    },
  ];

  for (const appointment of sampleAppointments) {
    await prisma.appointment.create({
      data: appointment,
    });
  }
  console.log('✅ Sample appointments created');

  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('👤 Admin Login:');
  console.log('   Email: admin@luxecuts.com');
  console.log('   Password: admin123');
  console.log('');
  console.log('👤 Test Customer Login:');
  console.log('   Email: john@example.com');
  console.log('   Password: password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

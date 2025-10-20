#!/usr/bin/env node

/**
 * Create Test Appointments Script
 * Creates sample appointments for testing reminder functionality
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestAppointments(count = 5) {
  console.log(`🧪 Creating ${count} test appointments...\n`);

  const results = {
    created: [],
    errors: [],
  };

  // Get a test user (create one if needed)
  let testUser = await prisma.user.findFirst({
    where: {
      OR: [{ role: 'CUSTOMER' }, { email: { contains: 'test' } }],
    },
  });

  if (!testUser) {
    console.log('📝 Creating test user...');
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        provider: 'whatsapp',
        providerId: '+1234567890',
        phone: '+1234567890',
      },
    });
    console.log(`✅ Created test user: ${testUser.email}\n`);
  } else {
    console.log(`✅ Using existing user: ${testUser.email}\n`);
  }

  // Get available services and stylists
  const services = await prisma.service.findMany({ take: 3 });
  const stylists = await prisma.stylist.findMany({ take: 2 });

  if (services.length === 0) {
    console.error(
      '❌ No services found. Please add services to the database first.'
    );
    process.exit(1);
  }

  console.log('📅 Creating appointments...\n');

  // Create appointments for different time ranges
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow

  const in24Hours = new Date();
  in24Hours.setHours(in24Hours.getHours() + 24);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(10, 0, 0, 0);

  const dates = [tomorrow, in24Hours, nextWeek];

  for (let i = 0; i < count; i++) {
    try {
      const service = services[i % services.length];
      const stylist = stylists[i % stylists.length];
      const appointmentDate = dates[i % dates.length];

      const appointment = await prisma.appointment.create({
        data: {
          userId: testUser.id,
          date: appointmentDate.toISOString().split('T')[0],
          time: appointmentDate.toTimeString().substring(0, 5),
          services: {
            connect: { id: service.id },
          },
          stylist: stylist ? { connect: { id: stylist.id } } : undefined,
          status: 'CONFIRMED',
          totalPrice: parseFloat(service.price),
          duration: service.duration,
          reminderSent: false,
          customerName: testUser.name,
          customerEmail: testUser.email,
          customerPhone: testUser.phone || '',
        },
        include: {
          services: true,
          stylist: true,
        },
      });

      results.created.push(appointment);

      console.log(`✅ Appointment ${i + 1}/${count}:`);
      console.log(`   Date: ${appointment.date} ${appointment.time}`);
      console.log(
        `   Service: ${appointment.services.map((s) => s.name).join(', ')}`
      );
      console.log(`   Stylist: ${appointment.stylist?.name || 'Any'}`);
      console.log(`   Customer: ${appointment.customerName}\n`);
    } catch (error) {
      console.error(`❌ Error creating appointment ${i + 1}:`, error.message);
      results.errors.push(error.message);
    }
  }

  console.log('='.repeat(60));
  console.log('📊 Summary:');
  console.log(`  ✅ Created: ${results.created.length}`);
  console.log(`  ❌ Errors: ${results.errors.length}`);
  console.log('='.repeat(60));

  if (results.created.length > 0) {
    console.log('\n📝 Next Steps:');
    console.log('1. Test reminders: curl -X POST http://localhost:3000/api/reminders/send');
    console.log('2. Check reminder count: curl http://localhost:3000/api/reminders/send');
    console.log('3. View in admin dashboard: http://localhost:3000/admin');
  }

  await prisma.$disconnect();
}

// Parse command line arguments
const args = process.argv.slice(2);
const countArg = args.find((arg) => arg.startsWith('--count='));
const count = countArg ? parseInt(countArg.split('=')[1]) : 5;

createTestAppointments(count).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

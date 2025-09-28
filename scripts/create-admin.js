#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function manageAdmin() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];
    const email = args[1];

    if (command === 'promote' && email) {
      console.log(`🔧 Promoting user ${email} to admin...`);

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        console.log(`❌ User with email ${email} not found.`);
        console.log('💡 User must first sign up via WhatsApp or Telegram OAuth.');
        return;
      }

      if (user.role === 'ADMIN') {
        console.log(`✅ User ${email} is already an admin.`);
        return;
      }

      // Promote to admin
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { role: 'ADMIN' },
      });

      console.log(`✅ User ${email} has been promoted to admin!`);
      console.log('🎉 They can now access the admin dashboard.');
    } else {
      console.log('📋 Admin Management Script');
      console.log('');
      console.log('This app uses OAuth-only authentication (WhatsApp/Telegram).');
      console.log('To create an admin user:');
      console.log('');
      console.log('1️⃣  First, have the user sign up via WhatsApp or Telegram OAuth');
      console.log('2️⃣  Then run: node scripts/create-admin.js promote <email>');
      console.log('');
      console.log('Example:');
      console.log('  node scripts/create-admin.js promote admin@luxecuts.com');
      console.log('');
      console.log('📋 Available commands:');
      console.log('  promote <email>  - Promote existing OAuth user to admin');
    }
  } catch (error) {
    console.error('❌ Error managing admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

manageAdmin();

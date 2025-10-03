#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Audit logging function
function logAdminAction(action, email, actor = 'CLI') {
  const timestamp = new Date().toISOString();
  console.log(`\n📝 [AUDIT LOG] ${timestamp}`);
  console.log(`   Action: ${action}`);
  console.log(`   Target: ${email}`);
  console.log(`   Actor: ${actor}\n`);
}

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

      // Verify OAuth completion
      if (!user.authProvider || (!user.telegramId && !user.whatsappPhone)) {
        console.log(`⚠️  Warning: User ${email} may not have completed OAuth setup.`);
        console.log(`   Auth Provider: ${user.authProvider || 'None'}`);
        console.log(`   Telegram ID: ${user.telegramId || 'None'}`);
        console.log(`   WhatsApp: ${user.whatsappPhone || 'None'}`);
        console.log('');
        console.log('Proceeding with promotion anyway...');
      }

      // Promote to admin
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { role: 'ADMIN' },
      });

      logAdminAction('PROMOTE', email);
      console.log(`✅ User ${email} has been promoted to admin!`);
      console.log('🎉 They can now access the admin dashboard.');
    } else if (command === 'demote' && email) {
      console.log(`🔧 Demoting user ${email} from admin...`);

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        console.log(`❌ User with email ${email} not found.`);
        return;
      }

      if (user.role === 'CUSTOMER') {
        console.log(`✅ User ${email} is already a customer (not an admin).`);
        return;
      }

      // Count admins before demotion
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        console.log(`❌ Cannot demote ${email} - they are the last admin!`);
        console.log('💡 Promote another user to admin first.');
        return;
      }

      // Demote to customer
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { role: 'CUSTOMER' },
      });

      logAdminAction('DEMOTE', email);
      console.log(`✅ User ${email} has been demoted to customer.`);
      console.log('👤 They no longer have admin access.');
    } else if (command === 'list') {
      console.log('👥 Current Admin Users:');
      console.log('');

      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          email: true,
          name: true,
          authProvider: true,
          telegramId: true,
          whatsappPhone: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (admins.length === 0) {
        console.log('❌ No admin users found!');
        console.log('💡 Run: node scripts/create-admin.js promote <email>');
        return;
      }

      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name} (${admin.email})`);
        console.log(`   Provider: ${admin.authProvider || 'Unknown'}`);
        console.log(`   Telegram: ${admin.telegramId || 'Not linked'}`);
        console.log(`   WhatsApp: ${admin.whatsappPhone || 'Not linked'}`);
        console.log(`   Created: ${admin.createdAt.toLocaleDateString()}`);
        console.log('');
      });

      console.log(`Total: ${admins.length} admin(s)`);
    } else {
      console.log('📋 Admin Management Script');
      console.log('');
      console.log('This app uses OAuth-only authentication (WhatsApp/Telegram).');
      console.log('To manage admin users:');
      console.log('');
      console.log('1️⃣  First, have the user sign up via WhatsApp or Telegram OAuth');
      console.log('2️⃣  Then run the appropriate command below');
      console.log('');
      console.log('📋 Available commands:');
      console.log('  promote <email>  - Promote existing OAuth user to admin');
      console.log('  demote <email>   - Demote admin user to customer');
      console.log('  list             - List all current admin users');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/create-admin.js promote admin@luxecuts.com');
      console.log('  node scripts/create-admin.js demote old-admin@luxecuts.com');
      console.log('  node scripts/create-admin.js list');
    }
  } catch (error) {
    console.error('❌ Error managing admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

manageAdmin();

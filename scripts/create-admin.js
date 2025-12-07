#!/usr/bin/env node

/**
 * Admin Management Script - Drizzle ORM Version
 *
 * This script manages admin users in the database.
 * Since it runs standalone (not in Cloudflare), it uses DATABASE_URL directly.
 */

const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { eq, asc } = require('drizzle-orm');
const { text, pgTable, pgEnum, integer, boolean, timestamp } = require('drizzle-orm/pg-core');

// Inline schema for standalone usage
const roleEnum = pgEnum('Role', ['CUSTOMER', 'STYLIST', 'ADMIN']);
const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'),
  role: roleEnum('role').default('CUSTOMER').notNull(),
  authProvider: text('authProvider'),
  telegramId: integer('telegramId').unique(),
  whatsappPhone: text('whatsappPhone').unique(),
  avatar: text('avatar'),
  lastVisitDate: timestamp('lastVisitDate'),
  totalVisits: integer('totalVisits').default(0).notNull(),
  lastRetentionMessageSent: timestamp('lastRetentionMessageSent'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql);

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
      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      const user = userResults[0];

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
      await db
        .update(users)
        .set({ role: 'ADMIN', updatedAt: new Date() })
        .where(eq(users.email, email.toLowerCase()));

      logAdminAction('PROMOTE', email);
      console.log(`✅ User ${email} has been promoted to admin!`);
      console.log('🎉 They can now access the admin dashboard.');
    } else if (command === 'demote' && email) {
      console.log(`🔧 Demoting user ${email} from admin...`);

      // Find user by email
      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      const user = userResults[0];

      if (!user) {
        console.log(`❌ User with email ${email} not found.`);
        return;
      }

      if (user.role === 'CUSTOMER') {
        console.log(`✅ User ${email} is already a customer (not an admin).`);
        return;
      }

      // Count admins before demotion
      const adminResults = await db.select().from(users).where(eq(users.role, 'ADMIN'));
      const adminCount = adminResults.length;

      if (adminCount <= 1) {
        console.log(`❌ Cannot demote ${email} - they are the last admin!`);
        console.log('💡 Promote another user to admin first.');
        return;
      }

      // Demote to customer
      await db
        .update(users)
        .set({ role: 'CUSTOMER', updatedAt: new Date() })
        .where(eq(users.email, email.toLowerCase()));

      logAdminAction('DEMOTE', email);
      console.log(`✅ User ${email} has been demoted to customer.`);
      console.log('👤 They no longer have admin access.');
    } else if (command === 'list') {
      console.log('👥 Current Admin Users:');
      console.log('');

      const admins = await db
        .select({
          email: users.email,
          name: users.name,
          authProvider: users.authProvider,
          telegramId: users.telegramId,
          whatsappPhone: users.whatsappPhone,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.role, 'ADMIN'))
        .orderBy(asc(users.createdAt));

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
  }
  // No disconnect needed for HTTP-based Neon driver
}

manageAdmin();

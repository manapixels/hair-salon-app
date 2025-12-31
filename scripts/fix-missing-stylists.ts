/**
 * Script: Fix Missing Stylist Records
 *
 * Creates stylist records for users who have STYLIST role but no corresponding
 * stylist record in the stylists table.
 *
 * Usage: npx tsx scripts/fix-missing-stylists.ts
 */
import 'dotenv/config';
import { getDb } from '../src/db';
import * as schema from '../src/db/schema';
import { sql } from 'drizzle-orm';

// Default working hours for new stylists
const DEFAULT_WORKING_HOURS = {
  monday: { start: '09:00', end: '18:00' },
  tuesday: { start: '09:00', end: '18:00' },
  wednesday: { start: '09:00', end: '18:00' },
  thursday: { start: '09:00', end: '18:00' },
  friday: { start: '09:00', end: '18:00' },
  saturday: { start: '10:00', end: '17:00' },
  sunday: null, // Closed
};

async function main() {
  console.log('🔍 Checking for users with STYLIST role but no stylist record...\n');

  const db = await getDb();

  // Get all users with STYLIST role
  const usersWithStylistRole = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      roles: schema.users.roles,
    })
    .from(schema.users)
    .where(sql`'STYLIST' = ANY(${schema.users.roles})`);

  // Get all stylist records
  const stylistRecords = await db
    .select({
      id: schema.stylists.id,
      userId: schema.stylists.userId,
    })
    .from(schema.stylists);

  // Find users missing stylist records
  const missingRecords = usersWithStylistRole.filter(
    user => !stylistRecords.some(s => s.userId === user.id),
  );

  if (missingRecords.length === 0) {
    console.log('✅ All users with STYLIST role have corresponding stylist records!');
    process.exit(0);
  }

  console.log(`Found ${missingRecords.length} user(s) with STYLIST role but no stylist record:\n`);

  for (const user of missingRecords) {
    console.log(`  - ${user.name} (${user.email}) [ID: ${user.id}]`);
  }

  console.log('\n📝 Creating missing stylist records...\n');

  for (const user of missingRecords) {
    try {
      const now = new Date();
      await db.insert(schema.stylists).values({
        id: crypto.randomUUID(),
        name: user.name,
        email: user.email,
        userId: user.id,
        specialties: [], // Empty array, can be updated later
        workingHours: DEFAULT_WORKING_HOURS,
        blockedDates: [],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`  ✅ Created stylist record for ${user.name}`);
    } catch (error: any) {
      console.error(`  ❌ Failed to create record for ${user.name}: ${error.message}`);
    }
  }

  console.log('\n🎉 Done! Run the data integrity check to verify:');
  console.log('   GET /api/admin/data-integrity/check');

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

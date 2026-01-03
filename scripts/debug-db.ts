import { getDb } from '../src/db';
import { sql } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import 'dotenv/config'; // Make sure this is installed or use -r dotenv/config

async function main() {
  console.log('Connecting to DB...');
  try {
    const db = await getDb();

    // Check tables
    console.log('Checking tables...');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(
      'Tables:',
      tables.map((r: any) => r.table_name),
    );

    // Check migrations table
    console.log('Checking migrations...');
    try {
      const migrations = await db.execute(sql`SELECT * FROM "drizzle"."__drizzle_migrations"`);
      console.log('Migrations:', migrations);
    } catch (e: any) {
      console.log('Error reading migrations schema (drizzle info):', e.message);
      try {
        const migrationsPublic = await db.execute(sql`SELECT * FROM "__drizzle_migrations"`);
        console.log('Migrations (public):', migrationsPublic);
      } catch (e2: any) {
        console.log('Error reading migrations (public):', e2.message);
      }
    }

    // Check DepositStatus
    console.log('Checking DepositStatus...');
    try {
      const typeExists = await db.execute(sql`
            SELECT 1 FROM pg_type WHERE typname = 'DepositStatus'
        `);
      console.log('DepositStatus exists:', typeExists.length > 0);
    } catch (e: any) {
      console.log('Error checking type:', e.message);
    }
  } catch (err) {
    console.error('Fatal error:', err);
  }
  process.exit(0);
}

main();

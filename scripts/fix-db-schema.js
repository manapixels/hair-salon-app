const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env
const result = dotenv.config({ path: '.env' });
if (result.error) {
  console.log('Error loading .env', result.error);
}

console.log('Applying manual schema fix...');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

  try {
    await client.connect();
    console.log('Connected to DB.');

    // Add processingWaitTime
    console.log('Adding processingWaitTime...');
    await client.query(`
      ALTER TABLE "services" 
      ADD COLUMN IF NOT EXISTS "processingWaitTime" integer DEFAULT 0 NOT NULL;
    `);
    console.log('Added processingWaitTime.');

    // Add processingDuration
    console.log('Adding processingDuration...');
    await client.query(`
      ALTER TABLE "services" 
      ADD COLUMN IF NOT EXISTS "processingDuration" integer DEFAULT 0 NOT NULL;
    `);
    console.log('Added processingDuration.');

    console.log('Schema fix applied successfully.');
  } catch (err) {
    console.error('Error applying fix:', err);
  } finally {
    await client.end();
  }
}

main();

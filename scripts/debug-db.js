const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env
const result = dotenv.config({ path: '.env' });
if (result.error) {
  console.log('Error loading .env', result.error);
}

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Missing');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

  try {
    await client.connect();
    console.log('Connected to DB.');

    // Check migrations
    try {
      const mig = await client.query('SELECT * FROM "__drizzle_migrations"');
      console.log('Migrations (public):', mig.rows);
    } catch (e) {
      console.log('No __drizzle_migrations (public)');
    }

    try {
      const mig2 = await client.query('SELECT * FROM "drizzle"."__drizzle_migrations"');
      console.log('Migrations (drizzle):', mig2.rows);
    } catch (e) {
      console.log('No __drizzle_migrations (drizzle schema)');
    }

    // Check Type
    const typeRes = await client.query("SELECT 1 FROM pg_type WHERE typname = 'DepositStatus'");
    console.log('DepositStatus exists:', typeRes.rowCount > 0);

    // Check admin_settings
    const settingsData = await client.query('SELECT * FROM admin_settings LIMIT 1');
    console.log('admin_settings row:', JSON.stringify(settingsData.rows[0], null, 2));

    // Check services columns
    const serviceColumns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'services'
    `);
    console.log(
      'services columns:',
      serviceColumns.rows.map(c => c.column_name),
    );
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();

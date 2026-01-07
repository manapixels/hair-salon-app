import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function addSocialLinksColumn() {
  console.log('Adding socialLinks column to admin_settings...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  const sql = neon(connectionString);

  try {
    await sql`
      ALTER TABLE admin_settings 
      ADD COLUMN IF NOT EXISTS "socialLinks" json 
      DEFAULT '{"instagram":{"url":"","isActive":false},"facebook":{"url":"","isActive":false},"whatsapp":{"url":"","isActive":false},"telegram":{"url":"","isActive":false}}'::json
    `;
    console.log('✓ Column added successfully');
  } catch (error: any) {
    if (error.code === '42701') {
      console.log('✓ Column already exists');
    } else {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  process.exit(0);
}

addSocialLinksColumn();

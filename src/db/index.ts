/**
 * Drizzle Database Connection
 *
 * Uses postgres.js for Cloudflare Workers + Hyperdrive (recommended by Cloudflare)
 * Falls back to @neondatabase/serverless for development
 */
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import postgres from 'postgres';
import * as schema from './schema';

// Type for our database instance
type DrizzleDb =
  | ReturnType<typeof drizzlePostgres<typeof schema>>
  | ReturnType<typeof drizzleNeon<typeof schema>>;

/**
 * Get database instance
 * - Cloudflare Workers: Uses postgres.js with Hyperdrive connection string
 * - Development: Uses Neon HTTP driver with DATABASE_URL
 */
export async function getDb(): Promise<DrizzleDb> {
  // Try Cloudflare context first (for Workers runtime)
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();

    // Access Hyperdrive binding - use postgres.js driver (recommended by Cloudflare)
    if (ctx?.env?.HYPERDRIVE) {
      const connectionString = (ctx.env.HYPERDRIVE as { connectionString: string })
        .connectionString;
      if (connectionString) {
        console.log('[Drizzle] Using postgres.js + Hyperdrive');
        // For Cloudflare Workers, use postgres.js with proper settings
        const client = postgres(connectionString, {
          prepare: false, // Important for Hyperdrive
          max: 1, // Single connection per request in Workers
        });
        return drizzlePostgres(client, { schema });
      }
    }

    // Fallback to DATABASE_URL in Cloudflare env (still uses postgres.js)
    if (ctx?.env?.DATABASE_URL) {
      console.log('[Drizzle] Using postgres.js with DATABASE_URL from Cloudflare env');
      const client = postgres(ctx.env.DATABASE_URL as string, { prepare: false });
      return drizzlePostgres(client, { schema });
    }
  } catch {
    // Not in Cloudflare Workers - fall through to development mode
  }

  // Development: use Neon HTTP driver (works without Node.js postgres extensions)
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  console.log('[Drizzle] Using Neon HTTP (development)');
  const client = neon(connectionString);
  return drizzleNeon(client, { schema });
}

// Type export for use in other modules
export type Database = DrizzleDb;

// Re-export schema for convenience
export * from './schema';

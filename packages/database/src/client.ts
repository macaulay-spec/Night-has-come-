import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@night-has-come/config';
import * as schema from './schema/index.js';

/**
 * Create a Postgres client.
 * In development, connects to Supabase local.
 * In production, connects to Supabase project.
 */
export function createClient() {
  const client = postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, { schema });
}

/**
 * Singleton database instance.
 */
export const db = createClient();

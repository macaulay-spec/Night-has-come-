import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '@night-has-come/config';

/**
 * Run database migrations.
 */
async function runMigrations() {
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  console.info('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.info('Migrations complete.');

  await client.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

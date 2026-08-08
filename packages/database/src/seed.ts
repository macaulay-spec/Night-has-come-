import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@night-has-come/config';
import { achievements } from './schema/index.js';

/**
 * Seed the database with initial data.
 * This is idempotent — safe to run multiple times.
 */
async function seed() {
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  console.info('Seeding database...');

  // Seed achievements
  const achievementData = [
    {
      key: 'first_signal',
      name: 'First Signal',
      description: 'Complete your first game.',
      xpReward: 100,
      category: 'beginner',
    },
    {
      key: 'cold_read',
      name: 'Cold Read',
      description: 'Correctly identify a Veil player through investigation.',
      xpReward: 200,
      category: 'skill',
    },
    {
      key: 'last_vote',
      name: 'Last Vote',
      description: 'Cast the deciding vote in an elimination.',
      xpReward: 150,
      category: 'skill',
    },
    {
      key: 'clean_hands',
      name: 'Clean Hands',
      description: 'Win a game as Civic without ever voting for a Civic player.',
      xpReward: 300,
      category: 'achievement',
    },
    {
      key: 'false_dawn',
      name: 'False Dawn',
      description: 'As Veil, survive being nominated and win the game.',
      xpReward: 300,
      category: 'achievement',
    },
    {
      key: 'lighthouse',
      name: 'Lighthouse',
      description: 'Save 3 players from elimination as Bulwark in one game.',
      xpReward: 400,
      category: 'achievement',
    },
    {
      key: 'unbroken_link',
      name: 'Unbroken Link',
      description: 'Win 5 consecutive games.',
      xpReward: 500,
      category: 'mastery',
    },
  ];

  for (const achievement of achievementData) {
    await db
      .insert(achievements)
      .values({
        key: achievement.key,
        name: achievement.name,
        description: achievement.description,
        xpReward: achievement.xpReward,
        category: achievement.category,
      })
      .onConflictDoNothing();
  }

  console.info(`Seeded ${achievementData.length} achievements.`);
  console.info('Seed complete.');

  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

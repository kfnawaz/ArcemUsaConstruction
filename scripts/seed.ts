/**
 * Main seed file that imports and runs the combined seed file from the seeds directory
 */
import { seedAllData } from './seeds/seed-all';

async function seedDatabase() {
  console.log('Starting database seeding...');
  
  try {
    await seedAllData();
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  }
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export { seedDatabase };

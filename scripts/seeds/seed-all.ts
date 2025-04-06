/**
 * Combined seed file that runs all individual seed files in the correct order
 */
import { seedTestimonialsData } from './seed-testimonials';
import { seedMessagesData } from './seed-messages';
import { seedBlogCategoriesData } from './seed-blog-categories';
import { seedBlogTagsData } from './seed-blog-tags';
import { seedNewslettersubscribersData } from './seed-newslettersubscribers';
import { seedQuoterequestsData } from './seed-quoterequests';
import { seedTeammembersData } from './seed-teammembers';

/**
 * Runs all seed functions in the appropriate order to respect foreign key constraints
 */
export async function seedAllData() {
  console.log('Starting complete database seeding...');

  await seedTestimonialsData();
  await seedMessagesData();
  await seedBlogCategoriesData();
  await seedBlogTagsData();
  await seedNewslettersubscribersData();
  await seedQuoterequestsData();
  await seedTeammembersData();
  
  console.log('✅ All database seeding completed successfully!');
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedAllData().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

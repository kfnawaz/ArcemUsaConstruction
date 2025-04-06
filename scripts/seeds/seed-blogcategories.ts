import { db } from '../../server/db';
import { blogCategories } from '../../shared/schema';

/**
 * Seeds the blogcategories table with data
 * This is an empty seed file as the table had no data
 */
export async function seedBlogcategoriesData() {
  console.log('Seeding blogcategories table...');
  
  const data: any[] = [];
  
  if (data.length === 0) {
    console.log('No data to seed for blogcategories');
    return;
  }
  
  try {
    // Insert in chunks to avoid oversized queries
    const chunkSize = 50;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await db.insert(blogCategories).values(chunk);
    }
    
    console.log(`✅ Successfully seeded ${data.length} records into blogcategories`);
  } catch (error) {
    console.error(`❌ Error seeding blogcategories:`, error);
  }
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedBlogcategoriesData().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

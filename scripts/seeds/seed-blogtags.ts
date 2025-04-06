import { db } from '../../server/db';
import { blogTags } from '../../shared/schema';

/**
 * Seeds the blogtags table with data
 * This is an empty seed file as the table had no data
 */
export async function seedBlogtagsData() {
  console.log('Seeding blogtags table...');
  
  const data: any[] = [];
  
  if (data.length === 0) {
    console.log('No data to seed for blogtags');
    return;
  }
  
  try {
    // Insert in chunks to avoid oversized queries
    const chunkSize = 50;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await db.insert(blogTags).values(chunk);
    }
    
    console.log(`✅ Successfully seeded ${data.length} records into blogtags`);
  } catch (error) {
    console.error(`❌ Error seeding blogtags:`, error);
  }
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedBlogtagsData().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

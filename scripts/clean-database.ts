import { db } from '../server/db';

/**
 * This script cleans (truncates) all database tables before seeding
 * Tables are cleared in reverse order of dependencies to respect foreign key constraints
 */
async function cleanDatabase() {
  try {
    console.log('Cleaning database...');
    // List of tables to clean - ordered to respect foreign key constraints
    const tables = [
      'blog_post_tags',
      'blog_post_categories',
      'blog_gallery',
      'blog_posts',
      'blog_tags',
      'blog_categories',
      'project_gallery',
      'projects',
      'service_gallery',
      'services',
      'testimonials',
      'messages',
      'quote_request_attachments',
      'quote_requests',
      'newsletter_subscribers',
      'team_members',
      'subcontractors',
      'vendors',
      'job_postings',
      'users'
    ];
    
    // Alternative approach to handle foreign key constraints safely
    try {
      // Clean all tables one by one, using CASCADE to handle dependencies
      for (const table of tables) {
        try {
          // Try with CASCADE first (safest option)
          await db.execute(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
          console.log(`✅ Cleaned table: ${table}`);
        } catch (err) {
          console.warn(`⚠️ Could not clean table ${table} with CASCADE: ${err.message}`);
          try {
            // Try a simple delete if truncate fails
            await db.execute(`DELETE FROM ${table};`);
            console.log(`✅ Deleted all rows from table: ${table}`);
          } catch (deleteErr) {
            console.error(`❌ Failed to clean table ${table}: ${deleteErr.message}`);
          }
        }
      }
    } catch (err) {
      console.error(`❌ Error cleaning tables: ${err.message}`);
    }
    
    console.log('Database cleaning completed!');
  } catch (error) {
    console.error('Error cleaning database:', error);
    process.exit(1);
  }
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  cleanDatabase().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export { cleanDatabase };
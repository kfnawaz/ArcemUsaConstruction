import fs from 'fs';
import path from 'path';
import { db } from '../server/db';
import * as schema from '../shared/schema';

const EXPORT_DIR = './database-export';

// Create an array of table names corresponding to the schema
const tables = [
  { name: 'users', query: db.select().from(schema.users) },
  { name: 'projects', query: db.select().from(schema.projects) },
  { name: 'project_gallery', query: db.select().from(schema.projectGallery) },
  { name: 'blog_posts', query: db.select().from(schema.blogPosts) },
  { name: 'blog_gallery', query: db.select().from(schema.blogGallery) },
  { name: 'blog_categories', query: db.select().from(schema.blogCategories) },
  { name: 'blog_tags', query: db.select().from(schema.blogTags) },
  { name: 'blog_post_categories', query: db.select().from(schema.blogPostCategories) },
  { name: 'blog_post_tags', query: db.select().from(schema.blogPostTags) },
  { name: 'testimonials', query: db.select().from(schema.testimonials) },
  { name: 'services', query: db.select().from(schema.services) },
  { name: 'service_gallery', query: db.select().from(schema.serviceGallery) },
  { name: 'messages', query: db.select().from(schema.messages) },
  { name: 'newsletter_subscribers', query: db.select().from(schema.newsletterSubscribers) },
  { name: 'quote_requests', query: db.select().from(schema.quoteRequests) },
  { name: 'quote_request_attachments', query: db.select().from(schema.quoteRequestAttachments) },
  { name: 'subcontractors', query: db.select().from(schema.subcontractors) },
  { name: 'vendors', query: db.select().from(schema.vendors) },
  { name: 'job_postings', query: db.select().from(schema.jobPostings) },
  { name: 'team_members', query: db.select().from(schema.teamMembers) },
];

async function exportTable(tableName: string, query: any): Promise<void> {
  try {
    console.log(`Exporting table: ${tableName}`);
    const records = await query;
    
    // Create the export directory if it doesn't exist
    if (!fs.existsSync(EXPORT_DIR)) {
      fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }
    
    // Write the data to a JSON file
    const filePath = path.join(EXPORT_DIR, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
    
    console.log(`✅ Exported ${records.length} records from ${tableName}`);
  } catch (error) {
    console.error(`❌ Error exporting table ${tableName}:`, error);
  }
}

async function exportAllData(): Promise<void> {
  console.log('Starting database export process...');
  
  // Export each table
  for (const table of tables) {
    await exportTable(table.name, table.query);
  }
  
  console.log(`\nExport completed! Files saved to ${EXPORT_DIR}`);
}

// Run the export
exportAllData().catch(error => {
  console.error('Export process failed:', error);
  process.exit(1);
});
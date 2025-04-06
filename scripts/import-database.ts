import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import postgres from 'postgres';

const IMPORT_DIR = './database-export';
// Use a direct postgres connection for the raw operations
const directDb = postgres(process.env.DATABASE_URL || "", { max: 1 });

// Define tables in the order they should be imported (respecting foreign key constraints)
const tables = [
  { name: 'users', table: schema.users },
  { name: 'projects', table: schema.projects },
  { name: 'project_gallery', table: schema.projectGallery },
  { name: 'blog_categories', table: schema.blogCategories },
  { name: 'blog_tags', table: schema.blogTags },
  { name: 'blog_posts', table: schema.blogPosts },
  { name: 'blog_gallery', table: schema.blogGallery },
  { name: 'blog_post_categories', table: schema.blogPostCategories },
  { name: 'blog_post_tags', table: schema.blogPostTags },
  { name: 'testimonials', table: schema.testimonials },
  { name: 'services', table: schema.services },
  { name: 'service_gallery', table: schema.serviceGallery },
  { name: 'messages', table: schema.messages },
  { name: 'newsletter_subscribers', table: schema.newsletterSubscribers },
  { name: 'quote_requests', table: schema.quoteRequests },
  { name: 'quote_request_attachments', table: schema.quoteRequestAttachments },
  { name: 'subcontractors', table: schema.subcontractors },
  { name: 'vendors', table: schema.vendors },
  { name: 'job_postings', table: schema.jobPostings },
  { name: 'team_members', table: schema.teamMembers },
];

async function clearTable(tableName: string): Promise<void> {
  try {
    console.log(`Clearing table: ${tableName}`);
    // Using a raw SQL query with CASCADE to handle foreign key constraints
    await directDb`TRUNCATE TABLE ${directDb(tableName)} CASCADE`;
    console.log(`✅ Cleared table ${tableName}`);
  } catch (error) {
    console.error(`❌ Error clearing table ${tableName}:`, error);
    throw error;
  }
}

async function importTable(tableName: string, table: any): Promise<void> {
  try {
    const filePath = path.join(IMPORT_DIR, `${tableName}.json`);
    
    // Check if the import file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Import file for ${tableName} not found, skipping.`);
      return;
    }
    
    // Read the data from the JSON file
    const rawData = fs.readFileSync(filePath, 'utf8');
    const records = JSON.parse(rawData);
    
    if (!records.length) {
      console.log(`⚠️ No records found for ${tableName}, skipping.`);
      return;
    }
    
    console.log(`Importing ${records.length} records into ${tableName}...`);
    
    // Insert the records into the table
    if (records.length > 0) {
      try {
        // Use a transaction to ensure all records are inserted or none
        await db.insert(table).values(records);
        console.log(`✅ Imported ${records.length} records into ${tableName}`);
      } catch (error) {
        console.error(`❌ Error inserting records into ${tableName}:`, error);
        throw error;
      }
    }
  } catch (error) {
    console.error(`❌ Error importing table ${tableName}:`, error);
    throw error;
  }
}

async function verifyImportDirectory(): Promise<boolean> {
  if (!fs.existsSync(IMPORT_DIR)) {
    console.error(`❌ Import directory ${IMPORT_DIR} does not exist.`);
    return false;
  }
  
  // Check if there are JSON files in the directory
  const files = fs.readdirSync(IMPORT_DIR).filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    console.error(`❌ No JSON files found in ${IMPORT_DIR}.`);
    return false;
  }
  
  return true;
}

async function getUserConfirmation(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise<boolean>((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function importAllData(): Promise<void> {
  console.log('Starting database import process...');
  
  // Verify that the import directory exists and contains files
  if (!await verifyImportDirectory()) {
    console.error('Import process aborted.');
    return;
  }
  
  // Ask for multiple confirmations before proceeding
  console.log('\n⚠️ IMPORTANT DATABASE OPERATION WARNING ⚠️');
  console.log('This script is designed ONLY for importing data into a NEW or EMPTY database.');
  console.log('It will DELETE ALL EXISTING DATA in the current database before importing.');
  console.log('DO NOT run this on your production database unless you are absolutely sure.');
  console.log('This is typically used when migrating to a new environment.\n');
  
  const initialConfirm = await getUserConfirmation(
    '⚠️ WARNING: Are you sure you want to delete all existing data in this database?'
  );
  
  if (!initialConfirm) {
    console.log('Import process aborted by user.');
    return;
  }
  
  const shouldProceed = await getUserConfirmation(
    '⚠️ FINAL WARNING: This operation cannot be undone. Type "yes" to confirm you want to proceed'
  );
  
  if (!shouldProceed) {
    console.log('Import process aborted by user.');
    return;
  }
  
  try {
    // Temporarily disable foreign key checks to allow clearing tables with circular dependencies
    await directDb`SET session_replication_role = replica`;
    
    // Clear each table
    for (const tableInfo of tables) {
      await clearTable(tableInfo.name);
    }
    
    // Re-enable foreign key checks
    await directDb`SET session_replication_role = DEFAULT`;
    
    // Import data into each table
    for (const tableInfo of tables) {
      await importTable(tableInfo.name, tableInfo.table);
    }
    
    console.log('\nImport completed successfully!');
  } catch (error) {
    console.error('Import process failed:', error);
    // Re-enable foreign key checks in case of failure
    await directDb`SET session_replication_role = DEFAULT`;
  } finally {
    // Close the direct database connection
    await directDb.end();
  }
}

// Run the import
importAllData().catch(error => {
  console.error('Import process failed:', error);
  directDb.end().then(() => process.exit(1));
});
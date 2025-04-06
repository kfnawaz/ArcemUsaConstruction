import { db, pool } from '../server/db';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

/**
 * This script restores the database with critical data without cleaning
 */
export async function restoreDatabase() {
  try {
    console.log('Starting database restoration...');

    // First, check if we need to restore the users table
    const userCount = await db.select({ count: sql`count(*)` }).from(schema.users);
    if (userCount[0].count === '0') {
      console.log('Restoring admin user...');
      
      // Insert the default admin user
      await db.insert(schema.users).values({
        username: 'admin',
        // Default password is 'admin123' - should be changed in production
        password: '$2b$10$rSB5qRjb9NxozESJgTvYFuTK.MjNMhtLMah00VSXtK4R.LfzXGXGi',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@arcemusa.com',
        createdAt: new Date(),
      });
      
      console.log('✅ Admin user restored');
    } else {
      console.log('✅ Users table already has data, skipping restoration');
    }
    
    // Check if the blog categories exist, and create them if not
    const categoryCount = await db.select({ count: sql`count(*)` }).from(schema.blogCategories);
    if (categoryCount[0].count === '0') {
      console.log('Restoring blog categories...');
      
      const defaultCategories = [
        {
          name: 'Construction Tips',
          description: 'Articles about construction techniques, trends, and tips',
          slug: 'construction-tips'
        },
        {
          name: 'Renovation Projects',
          description: 'Articles about renovation projects and home improvement',
          slug: 'renovation-projects'
        },
        {
          name: 'Architectural Design',
          description: 'Articles about architectural design and concepts',
          slug: 'architectural-design'
        },
        {
          name: 'Sustainable Building',
          description: 'Articles about sustainable and eco-friendly building practices',
          slug: 'sustainable-building'
        },
        {
          name: 'Industry News',
          description: 'Latest news and updates from the construction industry',
          slug: 'industry-news'
        },
        {
          name: 'Construction Technology',
          description: 'How technology is transforming the construction industry',
          slug: 'construction-technology'
        }
      ];
      
      // Insert the categories
      for (const category of defaultCategories) {
        await db.insert(schema.blogCategories).values(category);
      }
      
      console.log('✅ Blog categories restored');
    } else {
      console.log('✅ Blog categories already exist, skipping restoration');
    }
    
    // Check if the blog tags exist, and create them if not
    const tagCount = await db.select({ count: sql`count(*)` }).from(schema.blogTags);
    if (tagCount[0].count === '0') {
      console.log('Restoring blog tags...');
      
      const defaultTags = [
        { name: 'Construction', slug: 'construction' },
        { name: 'Architecture', slug: 'architecture' },
        { name: 'Green Building', slug: 'green-building' },
        { name: 'Residential', slug: 'residential' },
        { name: 'Commercial', slug: 'commercial' },
        { name: 'Renovation', slug: 'renovation' },
        { name: 'Tips', slug: 'tips' },
        { name: 'Design', slug: 'design' },
        { name: 'Industry', slug: 'industry' },
        { name: 'Safety', slug: 'safety' }
      ];
      
      // Insert the tags
      for (const tag of defaultTags) {
        await db.insert(schema.blogTags).values(tag);
      }
      
      console.log('✅ Blog tags restored');
    } else {
      console.log('✅ Blog tags already exist, skipping restoration');
    }
    
    // Check if the required tables are populated and add sample data if needed
    const projectCount = await db.select({ count: sql`count(*)` }).from(schema.projects);
    if (projectCount[0].count === '0') {
      // We should have a full data restore here, but we'll just notify
      console.log('⚠️ Projects table is empty. You may want to restore project data separately.');
    }

    const serviceCount = await db.select({ count: sql`count(*)` }).from(schema.services);
    if (serviceCount[0].count === '0') {
      // We should have a full data restore here, but we'll just notify
      console.log('⚠️ Services table is empty. You may want to restore service data separately.');
    }
    
    const blogPostCount = await db.select({ count: sql`count(*)` }).from(schema.blogPosts);
    if (blogPostCount[0].count === '0') {
      // We should have a full data restore here, but we'll just notify
      console.log('⚠️ Blog posts table is empty. You may want to restore blog post data separately.');
    }

    // Try to restore testimonials from the export file
    console.log('Attempting to restore testimonials from export file...');
    try {
      const testimonialsPath = path.join(process.cwd(), 'exports', 'testimonials.json');
      
      if (fs.existsSync(testimonialsPath)) {
        const testimonialData = JSON.parse(fs.readFileSync(testimonialsPath, 'utf8'));
        
        if (testimonialData.length > 0) {
          console.log(`Found ${testimonialData.length} testimonials to restore`);
          
          // Check if testimonials are already in the database
          const existingCount = await db.select({ count: sql`count(*)` }).from(schema.testimonials);
          
          if (existingCount[0].count === '0') {
            // Insert the testimonials
            for (const testimonial of testimonialData) {
              await db.insert(schema.testimonials).values(testimonial);
            }
            console.log('✅ Testimonials restored from export file');
          } else {
            console.log('✅ Testimonials already exist in the database, skipping restoration');
          }
        }
      } else {
        console.log('No testimonials export file found, skipping testimonials restoration');
      }
    } catch (error) {
      console.error('Error restoring testimonials:', error);
    }
    
    // Try to restore messages from the export file
    console.log('Attempting to restore messages from export file...');
    try {
      const messagesPath = path.join(process.cwd(), 'exports', 'messages.json');
      
      if (fs.existsSync(messagesPath)) {
        const messageData = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
        
        if (messageData.length > 0) {
          console.log(`Found ${messageData.length} messages to restore`);
          
          // Check if messages are already in the database
          const existingCount = await db.select({ count: sql`count(*)` }).from(schema.messages);
          
          if (existingCount[0].count === '0') {
            // Insert the messages
            for (const message of messageData) {
              await db.insert(schema.messages).values(message);
            }
            console.log('✅ Messages restored from export file');
          } else {
            console.log('✅ Messages already exist in the database, skipping restoration');
          }
        }
      } else {
        console.log('No messages export file found, skipping messages restoration');
      }
    } catch (error) {
      console.error('Error restoring messages:', error);
    }

    console.log('Database restoration completed!');
  } catch (error) {
    console.error('Error during database restoration:', error);
  }
}

// Run the script if executed directly
if (import.meta.url.endsWith(process.argv[1])) {
  restoreDatabase().then(() => {
    console.log('Restoration process completed');
    process.exit(0);
  }).catch(err => {
    console.error('Error in restoration process:', err);
    process.exit(1);
  });
}
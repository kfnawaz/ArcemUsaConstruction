import { db, pool } from '../../server/db';
import { blogCategories } from '../../shared/schema';

/**
 * Seeds the blog_categories table with data
 */
export async function seedBlogCategoriesData() {
  console.log('Seeding blog_categories table...');
  
  // Simplified data object that matches the actual database schema
  const data = [
    {
      "id": 1,
      "name": "Construction Tips",
      "slug": "construction-tips",
      "description": "Helpful tips and advice for construction projects"
    },
    {
      "id": 2,
      "name": "Industry News",
      "slug": "industry-news",
      "description": "Latest news and trends in the construction industry"
    },
    {
      "id": 3,
      "name": "Project Showcase",
      "slug": "project-showcase",
      "description": "Featured construction projects and case studies"
    },
    {
      "id": 4,
      "name": "Company Updates",
      "slug": "company-updates",
      "description": "News and updates about our company"
    },
    {
      "id": 5,
      "name": "Technology",
      "slug": "technology",
      "description": "New technologies and innovations in construction"
    }
  ];
  
  if (data.length === 0) {
    console.log('No data to seed for blog_categories');
    return;
  }
  
  try {
    // Use the raw pool to execute SQL queries directly
    for (const category of data) {
      await pool`
        INSERT INTO blog_categories (id, name, slug, description) 
        VALUES (${category.id}, ${category.name}, ${category.slug}, ${category.description || null})
        ON CONFLICT (id) DO UPDATE 
        SET name = ${category.name}, slug = ${category.slug}, description = ${category.description || null}
      `;
    }
    
    console.log(`✅ Successfully seeded ${data.length} records into blog_categories`);
  } catch (error) {
    console.error(`❌ Error seeding blog_categories:`, error);
  }
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedBlogCategoriesData().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
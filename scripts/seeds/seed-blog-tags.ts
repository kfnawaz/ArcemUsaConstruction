import { db, pool } from '../../server/db';
import { blogTags } from '../../shared/schema';

/**
 * Seeds the blog_tags table with data
 */
export async function seedBlogTagsData() {
  console.log('Seeding blog_tags table...');
  
  // Simplified data object that matches the actual database schema
  const data = [
    {
      "id": 1,
      "name": "Construction",
      "slug": "construction"
    },
    {
      "id": 2,
      "name": "Architecture",
      "slug": "architecture"
    },
    {
      "id": 3,
      "name": "Green Building",
      "slug": "green-building"
    },
    {
      "id": 4,
      "name": "Residential",
      "slug": "residential"
    },
    {
      "id": 5,
      "name": "Commercial",
      "slug": "commercial"
    },
    {
      "id": 6,
      "name": "Renovation",
      "slug": "renovation"
    },
    {
      "id": 7,
      "name": "Tips",
      "slug": "tips"
    },
    {
      "id": 8,
      "name": "Design",
      "slug": "design"
    },
    {
      "id": 9,
      "name": "Industry",
      "slug": "industry"
    },
    {
      "id": 10,
      "name": "Safety",
      "slug": "safety"
    }
  ];
  
  if (data.length === 0) {
    console.log('No data to seed for blog_tags');
    return;
  }
  
  try {
    // Use the raw pool to execute SQL queries directly
    for (const tag of data) {
      await pool`
        INSERT INTO blog_tags (id, name, slug) 
        VALUES (${tag.id}, ${tag.name}, ${tag.slug})
        ON CONFLICT (id) DO UPDATE 
        SET name = ${tag.name}, slug = ${tag.slug}
      `;
    }
    
    console.log(`✅ Successfully seeded ${data.length} records into blog_tags`);
  } catch (error) {
    console.error(`❌ Error seeding blog_tags:`, error);
  }
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedBlogTagsData().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
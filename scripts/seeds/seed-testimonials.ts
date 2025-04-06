import { db } from '../../server/db';
import { testimonials } from '../../shared/schema';

/**
 * Seeds the testimonials table with data
 * Generated from actual database content
 */
export async function seedTestimonialsData() {
  console.log('Seeding testimonials table...');
  
  const data = [
  {
    "id": 4,
    "name": "John Doe",
    "position": "CEO",
    "company": "ABC Corp",
    "content": "This construction company did an amazing job on our office building. Highly recommended!",
    "email": "john@example.com",
    "rating": 5,
    "image": null,
    "approved": true,
    "createdAt": new Date("2025-03-08T04:02:05.400Z")
  },
  {
    "id": 1,
    "name": "Michael Johnson",
    "position": "CEO",
    "company": "Johnson Enterprises",
    "content": "ARCEMUSA exceeded all our expectations with our commercial building project. Their attention to detail, transparent communication, and exceptional craftsmanship made the entire process smooth and stress-free. The project was completed on time and within budget.",
    "email": null,
    "rating": 5,
    "image": "https://randomuser.me/api/portraits/men/32.jpg",
    "approved": true,
    "createdAt": new Date("2025-03-08T04:01:39.813Z")
  },
  {
    "id": 2,
    "name": "Sarah Thompson",
    "position": "Homeowner",
    "company": "",
    "content": "Working with ARCEMUSA on our custom home was a fantastic experience. They truly listened to our vision and brought it to life with exceptional craftsmanship. Their team was professional, responsive, and dedicated to quality at every step.",
    "email": null,
    "rating": 5,
    "image": "https://randomuser.me/api/portraits/women/44.jpg",
    "approved": false,
    "createdAt": new Date("2025-03-08T04:01:39.813Z")
  },
  {
    "id": 3,
    "name": "David Wilson",
    "position": "Owner",
    "company": "Wilson Retail Group",
    "content": "We hired ARCEMUSA for our retail space renovation, and the results were outstanding. Their innovative design solutions maximized our space and created an inviting environment for our customers. The team's expertise and professionalism were evident throughout the project.",
    "email": null,
    "rating": 5,
    "image": "https://randomuser.me/api/portraits/men/55.jpg",
    "approved": true,
    "createdAt": new Date("2025-03-08T04:01:39.813Z")
  }
];
  
  if (data.length === 0) {
    console.log('No data to seed for testimonials');
    return;
  }
  
  try {
    // Insert in chunks to avoid oversized queries
    const chunkSize = 50;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await db.insert(testimonials).values(chunk);
    }
    
    console.log(`✅ Successfully seeded ${data.length} records into testimonials`);
  } catch (error) {
    console.error(`❌ Error seeding testimonials:`, error);
  }
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedTestimonialsData().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

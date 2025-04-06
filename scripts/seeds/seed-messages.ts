import { db } from '../../server/db';
import { messages } from '../../shared/schema';

/**
 * Seeds the messages table with data
 * Generated from actual database content
 */
export async function seedMessagesData() {
  console.log('Seeding messages table...');
  
  const data = [
  {
    "id": 1,
    "name": "Nawazuddin F Mohammed-Khaja",
    "email": "kfnawaz@gmail.com",
    "phone": "2817451997",
    "service": "residential",
    "message": "Service Interested In",
    "read": true,
    "createdAt": new Date("2025-03-07T20:33:59.056Z")
  }
];
  
  if (data.length === 0) {
    console.log('No data to seed for messages');
    return;
  }
  
  try {
    // Insert in chunks to avoid oversized queries
    const chunkSize = 50;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await db.insert(messages).values(chunk);
    }
    
    console.log(`✅ Successfully seeded ${data.length} records into messages`);
  } catch (error) {
    console.error(`❌ Error seeding messages:`, error);
  }
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedMessagesData().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

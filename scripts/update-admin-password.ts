import { db } from '../server/db';
import { hash } from 'bcrypt';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function hashPassword(password: string) {
  const salt = 10;
  return await hash(password, salt);
}

async function updateAdminPassword() {
  console.log('Updating admin password...');
  
  try {
    // Hash the new password
    const hashedPassword = await hashPassword('adminpassword');
    
    // Update the admin user password
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, 'admin'))
      .returning();
    
    if (result.length > 0) {
      console.log('Admin password updated successfully!');
    } else {
      console.log('Admin user not found.');
    }
  } catch (error) {
    console.error('Error updating admin password:', error);
  }
  
  process.exit(0);
}

updateAdminPassword();
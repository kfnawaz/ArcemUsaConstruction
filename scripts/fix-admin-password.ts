import { db } from '../server/db';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function updateAdminPassword() {
  console.log('Updating admin password with correct hashing...');
  
  try {
    // Hash the new password using the same method as in auth.ts
    const hashedPassword = await hashPassword('adminpassword');
    
    // Update the admin user password
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, 'admin'))
      .returning();
    
    if (result.length > 0) {
      console.log('Admin password updated successfully!');
      console.log('You can now log in with:');
      console.log('Username: admin');
      console.log('Password: adminpassword');
    } else {
      console.log('Admin user not found.');
    }
  } catch (error) {
    console.error('Error updating admin password:', error);
  }
  
  process.exit(0);
}

updateAdminPassword();
import 'dotenv/config';
import { db } from '../src/db';
import { user as userTable } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function makeUserAdmin(email: string) {
  try {
    console.log(`Making user ${email} an admin...`);
    
    // Find the user
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`Current role: ${user.role}`);
    
    // Update the user's role to admin
    const [updatedUser] = await db
      .update(userTable)
      .set({ 
        role: 'admin',
        updatedAt: new Date()
      })
      .where(eq(userTable.id, user.id))
      .returning();
    
    console.log(`✅ User ${updatedUser.email} is now an admin!`);
    console.log(`New role: ${updatedUser.role}`);
    
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    process.exit(0);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address as an argument');
  console.error('Usage: bun run scripts/make-user-admin.ts <email>');
  process.exit(1);
}

makeUserAdmin(email);
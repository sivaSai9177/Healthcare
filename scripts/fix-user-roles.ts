import { db } from '../src/db';
import { user } from '../src/db/schema';
import { isNull } from 'drizzle-orm';

async function fixUserRoles() {
  console.log('Checking for users without roles...');
  
  try {
    // Find all users without roles
    const usersWithoutRoles = await db.select()
      .from(user)
      .where(isNull(user.role));
    
    console.log(`Found ${usersWithoutRoles.length} users without roles`);
    
    if (usersWithoutRoles.length > 0) {
      // Update all users without roles to have 'user' role
      const result = await db.update(user)
        .set({ 
          role: 'user',
          updatedAt: new Date()
        })
        .where(isNull(user.role));
      
      console.log('Updated users with default role "user"');
    }
    
    // Verify the update
    const verifyUsers = await db.select({
      id: user.id,
      email: user.email,
      role: user.role
    })
    .from(user);
    
    console.log('\nAll users with roles:');
    verifyUsers.forEach(u => {
      console.log(`- ${u.email}: ${u.role || 'NO ROLE'}`);
    });
    
  } catch (error) {
    console.error('Error fixing user roles:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

fixUserRoles();
import 'dotenv/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { db } from '../src/db';
import { user as userTable } from '../src/db/schema';
import { organization } from '../src/db/organization-schema';
import { eq } from 'drizzle-orm';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment');
  console.error('Current env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
  process.exit(1);
}

async function checkUserOrganization() {
  const userId = '5E3DfzRisBVISTEEQAvkGUkhayZKfKLs'; // User from the logs
  
  console.log('\n🔍 === USER ORGANIZATION CHECK ===\n');
  console.log('Checking user:', userId);
  console.log('─'.repeat(50) + '\n');
  
  // Get user data
  const [user] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
    
  if (!user) {
    console.log('User not found!');
    return;
  }
  
  console.log('📊 User Data:');
  console.log('   ID:', user.id);
  console.log('   Email:', user.email);
  console.log('   Name:', user.name || '(not set)');
  console.log('   Role:', user.role);
  console.log('   Organization ID:', user.organizationId || '❌ NOT SET');
  console.log('   Organization Name:', user.organizationName || '❌ NOT SET');
  console.log('   Default Hospital ID:', user.defaultHospitalId || '❌ NOT SET');
  console.log('   Needs Profile Completion:', user.needsProfileCompletion);
  console.log('   Status:', user.isActive ? '✅ Active' : '❌ Inactive');
  console.log('   Created:', user.createdAt?.toLocaleString());
  console.log('   Updated:', user.updatedAt?.toLocaleString());
  
  // If user has org ID but no org name, fetch it
  if (user.organizationId && !user.organizationName) {
    console.log('\n⚠️  User has organization ID but no organization name!');
    
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, user.organizationId))
      .limit(1);
      
    if (org) {
      console.log('✓ Found organization:', org.name);
      console.log('\nUpdating user with organization name...');
      
      await db
        .update(userTable)
        .set({ organizationName: org.name })
        .where(eq(userTable.id, userId));
        
      console.log('✓ User updated successfully!');
    } else {
      console.log('❌ Organization not found!');
    }
  } else if (user.organizationName) {
    console.log('\n✓ User already has organization name:', user.organizationName);
  }
  
  // Check if user can access healthcare features
  console.log('\n🏥 Healthcare Access Check:');
  const hasRequiredFields = !!(user.organizationId && user.defaultHospitalId);
  console.log('   Has required fields:', hasRequiredFields ? '✅ Yes' : '❌ No');
  
  if (!hasRequiredFields) {
    const missing = [];
    if (!user.organizationId) missing.push('organizationId');
    if (!user.defaultHospitalId) missing.push('defaultHospitalId');
    console.log('   Missing fields:', missing.join(', '));
  }
  
  console.log('\n' + '─'.repeat(50));
  process.exit(0);
}

checkUserOrganization().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
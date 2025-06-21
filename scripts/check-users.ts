#!/usr/bin/env bun
/**
 * Check if test users exist in database
 */

import { db } from '@/src/db';
import { users } from '@/src/db/schema';

// Add missing import
import { eq } from 'drizzle-orm';

async function checkUsers() {
  console.log('🔍 Checking test users in database\n');
  
  const testEmails = [
    'operator@test.com',
    'doctor@test.com',
    'admin@test.com',
    'nurse@test.com',
    'doremon@gmail.com',
    'saipramod273@gmail.com'
  ];
  
  for (const email of testEmails) {
    try {
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          emailVerified: users.emailVerified,
          needsProfileCompletion: users.needsProfileCompletion,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (user) {
        console.log(`✅ ${email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Email Verified: ${user.emailVerified}`);
        console.log(`   Needs Profile Completion: ${user.needsProfileCompletion}`);
        console.log(`   Created: ${user.createdAt}`);
      } else {
        console.log(`❌ ${email} - NOT FOUND`);
      }
    } catch (error) {
      console.log(`❌ ${email} - ERROR: ${error.message}`);
    }
    console.log('');
  }
  
  // Count total users
  const totalUsers = await db.select({ count: users.id }).from(users);
  console.log(`\n📊 Total users in database: ${totalUsers.length}`);
}

checkUsers().catch(console.error);
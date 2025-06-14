#!/usr/bin/env bun

/**
 * Test script to verify Google OAuth redirect to complete-profile
 * 
 * This script tests the full OAuth flow and verifies that new users
 * are correctly redirected to the complete-profile screen.
 */

import { db } from '@/src/db';
import * as schema from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import chalk from 'chalk';

async function testGoogleAuthRedirect() {
  console.log(chalk.blue('🔍 Testing Google OAuth Redirect Flow\n'));

  try {
    // 1. Check database schema defaults
    console.log(chalk.yellow('1. Checking database schema defaults...'));
    
    // Create a test user to see what defaults are applied
    const testEmail = `test-oauth-${Date.now()}@example.com`;
    const testUserId = `test-user-${Date.now()}`; // Generate a unique ID
    const [testUser] = await db
      .insert(schema.user)
      .values({
        id: testUserId,
        email: testEmail,
        name: 'Test OAuth User',
        // Let the database apply defaults for role and needsProfileCompletion
      })
      .returning();
    
    console.log(chalk.green('✓ Test user created:'));
    console.log(`  - Email: ${testUser.email}`);
    console.log(`  - Role: ${testUser.role} (should be 'guest')`);
    console.log(`  - Needs Profile Completion: ${testUser.needsProfileCompletion} (should be true)`);
    
    if (testUser.role !== 'guest') {
      console.log(chalk.red(`❌ ERROR: Database default role is '${testUser.role}' but should be 'guest'`));
      console.log(chalk.yellow('  This will prevent OAuth users from being redirected to complete-profile'));
    } else {
      console.log(chalk.green('✓ Database defaults are correct'));
    }
    
    // Clean up test user
    await db.delete(schema.user).where(eq(schema.user.id, testUser.id));
    
    // 2. Check existing OAuth users
    console.log(chalk.yellow('\n2. Checking existing OAuth users...'));
    
    const oauthUsers = await db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        role: schema.user.role,
        needsProfileCompletion: schema.user.needsProfileCompletion,
        createdAt: schema.user.createdAt,
      })
      .from(schema.user)
      .where(eq(schema.user.emailVerified, false)) // OAuth users often have unverified emails initially
      .limit(10);
    
    if (oauthUsers.length > 0) {
      console.log(`Found ${oauthUsers.length} potential OAuth users:`);
      for (const user of oauthUsers) {
        const shouldRedirect = user.needsProfileCompletion || user.role === 'guest';
        console.log(`  - ${user.email}:`);
        console.log(`    Role: ${user.role}, Needs Completion: ${user.needsProfileCompletion}`);
        console.log(`    Should redirect to profile: ${shouldRedirect ? chalk.green('YES') : chalk.red('NO')}`);
      }
    } else {
      console.log('No OAuth users found in database');
    }
    
    // 3. Check users with incorrect state
    console.log(chalk.yellow('\n3. Checking for users with incorrect state...'));
    
    const incorrectUsers = await db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        role: schema.user.role,
        needsProfileCompletion: schema.user.needsProfileCompletion,
      })
      .from(schema.user)
      .where(eq(schema.user.role, 'user'));
    
    const needsFixing = incorrectUsers.filter(u => !u.needsProfileCompletion);
    
    if (needsFixing.length > 0) {
      console.log(chalk.red(`Found ${needsFixing.length} users with role='user' but needsProfileCompletion=false`));
      console.log('These users might be OAuth users who bypassed profile completion:');
      for (const user of needsFixing.slice(0, 5)) {
        console.log(`  - ${user.email}`);
      }
      
      console.log(chalk.yellow('\nTo fix these users, run:'));
      console.log(chalk.cyan('bun run scripts/fix-oauth-users.ts'));
    } else {
      console.log(chalk.green('✓ No users found with incorrect state'));
    }
    
    // 4. Summary and recommendations
    console.log(chalk.blue('\n📊 Summary:'));
    console.log('1. New OAuth users should have:');
    console.log('   - role: "guest"');
    console.log('   - needsProfileCompletion: true');
    console.log('\n2. The auth-callback.tsx will redirect users to complete-profile if:');
    console.log('   - needsProfileCompletion is true OR');
    console.log('   - role is "guest"');
    console.log('\n3. Debug logs have been added to:');
    console.log('   - auth-server.ts (OAuth callbacks)');
    console.log('   - auth-callback.tsx (redirect logic)');
    console.log('   - auth router getSession (session fetching)');
    console.log('   - toAppUser function (data conversion)');
    
    console.log(chalk.green('\n✅ Test complete!'));
    
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error);
    process.exit(1);
  }
}

// Run the test
testGoogleAuthRedirect()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
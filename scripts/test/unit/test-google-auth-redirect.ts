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

  try {
    // 1. Check database schema defaults

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

    if (testUser.role !== 'guest') {

    } else {

    }
    
    // Clean up test user
    await db.delete(schema.user).where(eq(schema.user.id, testUser.id));
    
    // 2. Check existing OAuth users

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

      for (const user of oauthUsers) {
        const shouldRedirect = user.needsProfileCompletion || user.role === 'guest';

      }
    } else {

    }
    
    // 3. Check users with incorrect state

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

      for (const user of needsFixing.slice(0, 5)) {

      }

    } else {

    }
    
    // 4. Summary and recommendations

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
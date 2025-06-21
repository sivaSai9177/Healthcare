#!/usr/bin/env bun
/**
 * Fix OAuth users who were created without needsProfileCompletion flag
 * This script identifies OAuth users who should complete their profile
 */

import { db } from '@/src/db';
import * as schema from '@/src/db/schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import chalk from 'chalk';

async function fixOAuthUsers() {

  try {
    // Find users who are likely OAuth users that skipped profile completion

    // First, let's check all users to understand the state
    const allUsers = await db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        role: schema.user.role,
        needsProfileCompletion: schema.user.needsProfileCompletion,
        organizationId: schema.user.organizationId,
        phoneNumber: schema.user.phoneNumber,
        emailVerified: schema.user.emailVerified,
      })
      .from(schema.user);

    // Find users who likely need fixing
    const usersToFix = allUsers.filter(user => {
      // OAuth users who skipped profile completion typically have:
      // 1. role = 'user' (instead of 'guest')
      // 2. needsProfileCompletion = false
      // 3. Missing organizationId, phoneNumber, etc.
      const hasIncompleteProfile = !user.organizationId || !user.phoneNumber;
      const hasWrongState = user.role === 'user' && !user.needsProfileCompletion;
      
      return hasIncompleteProfile && hasWrongState;
    });

    if (usersToFix.length === 0) {

      return;
    }
    
    // Display users to fix
    for (const user of usersToFix.slice(0, 10)) {

    }
    
    if (usersToFix.length > 10) {

    }

    // Check if --fix flag is provided
    if (!process.argv.includes('--fix')) {

      return;
    }

    // Update users to require profile completion
    let fixedCount = 0;
    for (const user of usersToFix) {
      try {
        const [updatedUser] = await db
          .update(schema.user)
          .set({
            role: 'guest', // Set to guest role to trigger profile completion
            needsProfileCompletion: true,
            updatedAt: new Date(),
          })
          .where(eq(schema.user.id, user.id))
          .returning();

        fixedCount++;
      } catch (error: any) {

      }
    }

  } catch (error) {
    console.error(chalk.red('❌ Error fixing OAuth users:'), error);
    process.exit(1);
  }
}

// Run the fix
fixOAuthUsers()
  .then(() => {
// TODO: Replace with structured logging - /* console.log('\n✅ OAuth user fix completed successfully!') */;
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ OAuth user fix failed:', error);
    process.exit(1);
  });
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
  console.log(chalk.blue('🔧 OAuth User Fix Script\n'));
  console.log(chalk.yellow('This script will fix OAuth users who bypassed profile completion\n'));

  try {
    // Find users who are likely OAuth users that skipped profile completion
    console.log(chalk.yellow('1. Finding users who need fixing...'));
    
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
    
    console.log(`Total users in database: ${allUsers.length}`);
    
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

    console.log(`\nFound ${usersToFix.length} users who might need fixing:`);
    
    if (usersToFix.length === 0) {
      console.log(chalk.green('✓ No users need fixing!'));
      return;
    }
    
    // Display users to fix
    for (const user of usersToFix.slice(0, 10)) {
      console.log(`\n${chalk.cyan(user.email)}:`);
      console.log(`  Current state: role='${user.role}', needsProfileCompletion=${user.needsProfileCompletion}`);
      console.log(`  Missing data: ${!user.organizationId ? 'organizationId ' : ''}${!user.phoneNumber ? 'phoneNumber' : ''}`);
    }
    
    if (usersToFix.length > 10) {
      console.log(chalk.gray(`\n... and ${usersToFix.length - 10} more users`));
    }

    // Check if --fix flag is provided
    if (!process.argv.includes('--fix')) {
      console.log(chalk.yellow('\n⚠️  Dry run mode - no changes made'));
      console.log(chalk.cyan('To apply fixes, run: bun run scripts/fix-oauth-users.ts --fix'));
      return;
    }

    console.log(chalk.yellow('\n2. Applying fixes...'));

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

        console.log(chalk.green(`✓ Fixed ${updatedUser.email}`));
        fixedCount++;
      } catch (error: any) {
        console.log(chalk.red(`✗ Failed to fix ${user.email}: ${error.message}`));
      }
    }

    console.log(chalk.green(`\n✅ Successfully updated ${fixedCount} out of ${usersToFix.length} users!`));
    console.log('These users will now be prompted to complete their profile on next login.');

  } catch (error) {
    console.error(chalk.red('❌ Error fixing OAuth users:'), error);
    process.exit(1);
  }
}

// Run the fix
fixOAuthUsers()
  .then(() => {
// TODO: Replace with structured logging - console.log('\n✅ OAuth user fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ OAuth user fix failed:', error);
    process.exit(1);
  });
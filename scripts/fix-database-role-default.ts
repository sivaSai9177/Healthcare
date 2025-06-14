#!/usr/bin/env bun

/**
 * Fix database default role from 'user' to 'guest'
 * This ensures new OAuth users are created with the correct role
 */

import { db } from '@/src/db';
import chalk from 'chalk';

async function fixDatabaseRoleDefault() {
  console.log(chalk.blue('🔧 Database Role Default Fix\n'));

  try {
    // 1. Check current database constraint
    console.log(chalk.yellow('1. Checking current database default for role column...'));
    
    const result = await db.execute(`
      SELECT column_name, column_default
      FROM information_schema.columns
      WHERE table_name = 'user' 
      AND column_name = 'role';
    `);
    
    const currentDefault = result.rows[0]?.column_default;
    console.log(`Current default: ${currentDefault || 'NULL'}`);
    
    if (currentDefault === "'guest'::text") {
      console.log(chalk.green('✓ Database default is already set to "guest"'));
      return;
    }
    
    // 2. Update the default constraint
    console.log(chalk.yellow('\n2. Updating database default to "guest"...'));
    
    await db.execute(`
      ALTER TABLE "user" 
      ALTER COLUMN role 
      SET DEFAULT 'guest';
    `);
    
    console.log(chalk.green('✓ Database default updated to "guest"'));
    
    // 3. Verify the change
    console.log(chalk.yellow('\n3. Verifying the change...'));
    
    const verifyResult = await db.execute(`
      SELECT column_name, column_default
      FROM information_schema.columns
      WHERE table_name = 'user' 
      AND column_name = 'role';
    `);
    
    const newDefault = verifyResult.rows[0]?.column_default;
    console.log(`New default: ${newDefault || 'NULL'}`);
    
    if (newDefault === "'guest'::text") {
      console.log(chalk.green('✓ Database default successfully changed to "guest"'));
    } else {
      console.log(chalk.red('❌ Failed to update database default'));
    }
    
    // 4. Summary
    console.log(chalk.blue('\n📊 Summary:'));
    console.log('- New users will now be created with role="guest" by default');
    console.log('- This ensures OAuth users are redirected to complete-profile');
    console.log('- Existing users are not affected by this change');
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to fix database default:'), error);
    process.exit(1);
  }
}

// Run the fix
fixDatabaseRoleDefault()
  .then(() => {
    console.log(chalk.green('\n✅ Database fix complete!'));
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
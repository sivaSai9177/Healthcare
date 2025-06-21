#!/usr/bin/env bun

/**
 * Fix database default role from 'user' to 'guest'
 * This ensures new OAuth users are created with the correct role
 */

import { db } from '@/src/db';
import chalk from 'chalk';

async function fixDatabaseRoleDefault() {

  try {
    // 1. Check current database constraint

    const result = await db.execute(`
      SELECT column_name, column_default
      FROM information_schema.columns
      WHERE table_name = 'user' 
      AND column_name = 'role';
    `);
    
    const currentDefault = result.rows[0]?.column_default;

    if (currentDefault === "'guest'::text") {

      return;
    }
    
    // 2. Update the default constraint

    await db.execute(`
      ALTER TABLE "user" 
      ALTER COLUMN role 
      SET DEFAULT 'guest';
    `);

    // 3. Verify the change

    const verifyResult = await db.execute(`
      SELECT column_name, column_default
      FROM information_schema.columns
      WHERE table_name = 'user' 
      AND column_name = 'role';
    `);
    
    const newDefault = verifyResult.rows[0]?.column_default;

    if (newDefault === "'guest'::text") {

    } else {

    }
    
    // 4. Summary

  } catch (error) {
    console.error(chalk.red('❌ Failed to fix database default:'), error);
    process.exit(1);
  }
}

// Run the fix
fixDatabaseRoleDefault()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
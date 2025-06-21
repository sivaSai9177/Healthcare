#!/usr/bin/env bun
/**
 * Quick test for user management functionality
 * This avoids React Native imports for testing
 */

import { db } from '../../src/db/server-db';
import { user as userTable } from '../../src/db/schema';
import chalk from 'chalk';

async function main() {

  try {
    // Test database connection

    const users = await db.select({
      id: userTable.id,
      email: userTable.email,
      name: userTable.name,
      role: userTable.role,
    })
    .from(userTable)
    .limit(5);

    if (users.length === 0) {

    } else {

      users.forEach((user, index) => {

      });
    }

  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
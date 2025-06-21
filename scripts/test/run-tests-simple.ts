#!/usr/bin/env bun
/**
 * Simple Test Runner with Docker Logging
 */

import { testLogger } from '../config/test-logger';
import { execSync } from 'child_process';
import chalk from 'chalk';

// Use the local Docker database
const DATABASE_URL = 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_test';

async function runScriptTests() {

  const scripts = [
    {
      name: 'User Management - Help',
      cmd: `DATABASE_URL="${DATABASE_URL}" bun scripts/users/manage-users.ts help`,
    },
    {
      name: 'User Management - List',
      cmd: `DATABASE_URL="${DATABASE_URL}" bun scripts/users/manage-users.ts list`,
    },
    {
      name: 'Database Management - Health',
      cmd: `DATABASE_URL="${DATABASE_URL}" bun scripts/database/manage-database-simple.ts health`,
    },
    {
      name: 'Database Management - Info',
      cmd: `DATABASE_URL="${DATABASE_URL}" bun scripts/database/manage-database-simple.ts info`,
    },
    {
      name: 'Auth Management - Debug',
      cmd: `DATABASE_URL="${DATABASE_URL}" bun scripts/auth/manage-auth.ts debug`,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const script of scripts) {

    try {
      const startTime = Date.now();
      const output = execSync(script.cmd, { encoding: 'utf8' });
      const duration = Date.now() - startTime;

      await testLogger.logTest(script.name, {
        status: 'pass',
        duration,
        testSuite: 'Script Tests',
      });
      
      passed++;
    } catch (error) {
      failed++;

      console.error(chalk.red(error.message || error));
      
      await testLogger.logTest(script.name, {
        status: 'fail',
        error,
        testSuite: 'Script Tests',
      });
    }
  }

  // Test user creation and deletion

  const testEmail = `test-${Date.now()}@example.com`;
  
  try {
    // Create user
    execSync(
      `DATABASE_URL="${DATABASE_URL}" bun scripts/users/manage-users.ts create --email=${testEmail} --password=Test123! --role=nurse --name="Test User"`,
      { encoding: 'utf8' }
    );

    // Delete user
    execSync(
      `DATABASE_URL="${DATABASE_URL}" bun scripts/users/manage-users.ts delete ${testEmail} --force`,
      { encoding: 'utf8' }
    );

    await testLogger.logTest('User Creation and Deletion', {
      status: 'pass',
      testSuite: 'Script Tests',
    });
    
    passed++;
  } catch (error) {
    failed++;

    console.error(chalk.red(error.message || error));
    
    await testLogger.logTest('User Creation and Deletion', {
      status: 'fail',
      error,
      testSuite: 'Script Tests',
    });
  }

  // Summary
  const total = passed + failed;

  if (failed > 0) {

  }

  await testLogger.logTestRunComplete({
    totalSuites: 1,
    totalTests: total,
    passed,
    failed,
    duration: Date.now(),
  });

  return failed === 0;
}

// Run tests
runScriptTests()
  .then((success) => {
    if (success) {

      process.exit(0);
    } else {

      process.exit(1);
    }
  })
  .catch((error) => {
    console.error(chalk.red('\n❌ Test runner error:'), error);
    process.exit(1);
  });
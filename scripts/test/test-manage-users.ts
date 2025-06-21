#!/usr/bin/env bun
/**
 * Test script for manage-users functionality
 * Run this to verify the enhanced user management works correctly
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

const MANAGE_USERS_PATH = '../users/manage-users.ts';

interface TestCase {
  name: string;
  command: string;
  expectedOutput?: string[];
  shouldFail?: boolean;
}

const testCases: TestCase[] = [
  {
    name: 'Show help',
    command: '',
    expectedOutput: ['Usage:', 'Actions:', 'setup-demo', 'setup-healthcare'],
  },
  {
    name: 'List users',
    command: 'list',
    expectedOutput: ['Listing all users'],
  },
  {
    name: 'Setup demo users',
    command: 'setup-demo',
    expectedOutput: ['Setting up demo users', 'Demo User Credentials'],
  },
  {
    name: 'Create single user',
    command: 'create test@example.com',
    expectedOutput: ['Creating user test@example.com'],
  },
  {
    name: 'Verify user',
    command: 'verify test@example.com',
    expectedOutput: ['Verifying user test@example.com'],
  },
  {
    name: 'Update user role',
    command: 'update test@example.com nurse',
    expectedOutput: ['Updating role for test@example.com to nurse'],
  },
  {
    name: 'Delete user',
    command: 'delete test@example.com',
    expectedOutput: ['Deleting user test@example.com'],
  },
];

async function runTest(testCase: TestCase): Promise<boolean> {

  try {
    const output = execSync(
      `bun run ${MANAGE_USERS_PATH} ${testCase.command}`,
      {
        encoding: 'utf-8',
        stdio: 'pipe',
        cwd: __dirname,
      }
    );
    
    if (testCase.shouldFail) {

      return false;
    }
    
    // Check expected output
    if (testCase.expectedOutput) {
      const outputLower = output.toLowerCase();
      const allFound = testCase.expectedOutput.every(expected => 
        outputLower.includes(expected.toLowerCase())
      );
      
      if (allFound) {

        return true;
      } else {

        return false;
      }
    }

    return true;
  } catch (error: any) {
    if (testCase.shouldFail) {

      return true;
    }

    if (error.stdout) {

    }
    if (error.stderr) {

    }
    return false;
  }
}

async function main() {

  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  if (failed === 0) {

    process.exit(0);
  } else {

    process.exit(1);
  }
}

// Run tests
main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
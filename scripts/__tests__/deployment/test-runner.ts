#!/usr/bin/env bun
/**
 * Test runner for deployment script integration tests
 * Executes comprehensive tests for manage-* scripts
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

const log = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.log(msg),
  warn: (msg: string) => console.log(msg),
};

async function runTests() {

  try {
    // Run tests with coverage
    log.info('Running integration tests with coverage...\n');
    
    execSync(
      'npx vitest run --config scripts/vitest.config.ts scripts/__tests__/deployment/*.integration.test.ts --coverage',
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          CI: 'true' // Disable interactive features
        }
      }
    );
    
    log.success('\nAll integration tests passed!');
    
    // Show coverage summary
    log.info('\nTest Coverage Summary:');
    try {
      const coverageReport = execSync(
        'npx c8 report --reporter=text-summary',
        { encoding: 'utf8' }
      );

    } catch {
      log.warn('Coverage report not available');
    }
    
  } catch (error: any) {
    log.error('Integration tests failed!');
    console.error(error.message);
    process.exit(1);
  }
}

// Run specific test suite if provided
const testSuite = process.argv[2];
if (testSuite) {

  try {
    execSync(
      `npx vitest run --config scripts/vitest.config.ts scripts/__tests__/deployment/${testSuite}.integration.test.ts`,
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test'
        }
      }
    );
    log.success(`\n${testSuite} tests passed!`);
  } catch (error: any) {
    log.error(`${testSuite} tests failed!`);
    process.exit(1);
  }
} else {
  runTests().catch(error => {
    log.error(`Unexpected error: ${error}`);
    process.exit(1);
  });
}
#!/usr/bin/env bun
/**
 * Test Runner for Management Scripts
 * Runs tests with Docker logging integration
 */

import { testLogger, interceptConsoleForTests } from '../config/test-logger';
import { execSync } from 'child_process';
import chalk from 'chalk';
import path from 'path';

// Test configuration
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/myexpo_test';
const ENABLE_LOGGING = process.env.ENABLE_TEST_LOGGING !== 'false';

async function runTests() {

  // Intercept console logs
  const restoreConsole = ENABLE_LOGGING ? interceptConsoleForTests() : () => {};
  
  const testSuites = [
    {
      name: 'User Management Tests',
      testFile: 'scripts/__tests__/users/manage-users.test.ts',
    },
    {
      name: 'Database Management Tests',
      testFile: 'scripts/__tests__/database/manage-database-simple.test.ts',
    },
    {
      name: 'Auth Management Tests',
      testFile: 'scripts/__tests__/auth/manage-auth.test.ts',
    },
  ];

  const results = {
    totalSuites: testSuites.length,
    totalTests: 0,
    passed: 0,
    failed: 0,
    duration: 0,
  };

  const startTime = Date.now();

  for (const suite of testSuites) {

    await testLogger.logSuiteStart(suite.name);

    const suiteStartTime = Date.now();
    let suitePassed = 0;
    let suiteFailed = 0;

    try {
      // Run tests with Bun
      const output = execSync(
        `DATABASE_URL="${TEST_DATABASE_URL}" bun test ${suite.testFile}`,
        {
          encoding: 'utf8',
          env: {
            ...process.env,
            DATABASE_URL: TEST_DATABASE_URL,
            NODE_ENV: 'test',
            ENABLE_TEST_LOGGING: ENABLE_LOGGING ? 'true' : 'false',
          },
        }
      );

      // Parse test output
      const passMatch = output.match(/(\d+) pass/);
      const failMatch = output.match(/(\d+) fail/);
      
      if (passMatch) {
        suitePassed = parseInt(passMatch[1]);
        results.passed += suitePassed;
      }
      
      if (failMatch) {
        suiteFailed = parseInt(failMatch[1]);
        results.failed += suiteFailed;
      }

      results.totalTests += suitePassed + suiteFailed;

      // Log individual test results
      const testLines = output.split('\n').filter(line => 
        line.includes('(pass)') || line.includes('(fail)')
      );

      for (const line of testLines) {
        const isPass = line.includes('(pass)');
        const testName = line.replace(/\s*\(pass\)|\(fail\).*$/, '').trim();
        const durationMatch = line.match(/\[(\d+\.?\d*)ms\]/);
        const duration = durationMatch ? parseFloat(durationMatch[1]) : undefined;

        await testLogger.logTest(testName, {
          status: isPass ? 'pass' : 'fail',
          duration,
          testSuite: suite.name,
        });
      }

      if (suiteFailed > 0) {

      }

    } catch (error) {

      console.error(error.stdout || error.message);
      
      // Try to parse any partial results
      if (error.stdout) {
        const output = error.stdout.toString();
        const passMatch = output.match(/(\d+) pass/);
        const failMatch = output.match(/(\d+) fail/);
        
        if (passMatch) {
          suitePassed = parseInt(passMatch[1]);
          results.passed += suitePassed;
        }
        
        if (failMatch) {
          suiteFailed = parseInt(failMatch[1]);
          results.failed += suiteFailed;
        }
        
        results.totalTests += suitePassed + suiteFailed;
      }
      
      await testLogger.logTest(suite.name, {
        status: 'fail',
        error,
        testSuite: suite.name,
      });
    }

    const suiteDuration = Date.now() - suiteStartTime;
    await testLogger.logSuiteEnd(suite.name, {
      passed: suitePassed,
      failed: suiteFailed,
      skipped: 0,
      duration: suiteDuration,
    });
  }

  results.duration = Date.now() - startTime;

  // Log test run summary
  await testLogger.logTestRunComplete(results);

  // Restore console
  restoreConsole();

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run script tests
async function testManagementScripts() {

  const scripts = [
    {
      name: 'manage-users.ts list',
      path: 'scripts/users/manage-users.ts',
      args: ['list'],
    },
    {
      name: 'manage-database-simple.ts health',
      path: 'scripts/database/manage-database-simple.ts',
      args: ['health'],
    },
    {
      name: 'manage-auth.ts debug',
      path: 'scripts/auth/manage-auth.ts',
      args: ['debug'],
    },
  ];

  for (const script of scripts) {
    try {
      const output = execSync(
        `DATABASE_URL="${TEST_DATABASE_URL}" bun ${script.path} ${script.args.join(' ')}`,
        {
          encoding: 'utf8',
          env: {
            ...process.env,
            DATABASE_URL: TEST_DATABASE_URL,
          },
        }
      );

      await testLogger.logScriptExecution(script.path, script.args, {
        success: true,
        output,
      });
    } catch (error) {
      await testLogger.logScriptExecution(script.path, script.args, {
        success: false,
        error,
      });
    }
  }
}

// Main execution
async function main() {
  try {
    // Test script execution first
    await testManagementScripts();
    
    // Then run unit tests
    await runTests();
  } catch (error) {
    console.error(chalk.red('\n❌ Test runner failed:'), error);
    process.exit(1);
  }
}

main();
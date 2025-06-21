#!/usr/bin/env bun
/**
 * [Test Script Name]
 * 
 * [Brief description of what this script tests]
 * 
 * Usage:
 *   bun run scripts/test/[script-name].ts [options]
 * 
 * Options:
 *   --help, -h     Show help
 *   --env          Environment to test against
 *   --verbose, -v  Enable verbose logging
 *   --bail         Stop on first failure
 */

import { 
  parseArgs, 
  printHelp, 
  logger, 
  handleError,
  measureTime
} from '../lib';
import { 
  validateEnvironment,
  config
} from '../config';
import {
  apiRequest,
  authenticate,
  authHeaders,
  assertStatus,
  assertData,
  createTestContext,
  checkApiHealth,
  getTestUser
} from '../lib/test-helpers';

interface Options {
  env: string;
  verbose: boolean;
  bail: boolean;
}

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

async function main() {
  try {
    const args = parseArgs();
    
    if (args.help || args.h) {
      printHelp({
        usage: 'bun run scripts/test/[script-name].ts [options]',
        description: '[Detailed description of test scenarios]',
        options: [
          { flag: '--help, -h', description: 'Show help' },
          { flag: '--env', description: 'Environment to test', default: 'local' },
          { flag: '--verbose, -v', description: 'Enable verbose logging' },
          { flag: '--bail', description: 'Stop on first failure' },
        ],
        examples: [
          'bun run scripts/test/[script-name].ts',
          'bun run scripts/test/[script-name].ts --env=staging',
          'bun run scripts/test/[script-name].ts --verbose --bail',
        ],
      });
      process.exit(0);
    }
    
    const options: Options = {
      env: String(args.env || config.APP_ENV),
      verbose: Boolean(args.verbose || args.v),
      bail: Boolean(args.bail),
    };
    
    if (options.verbose) {
      logger.level = 'DEBUG';
    }
    
    // Validate environment
    await validateEnvironment(['API_URL']);
    
    // Run tests
    await runTests(options);
    
  } catch (error) {
    handleError(error);
  }
}

async function runTests(options: Options) {
  logger.info(`Running tests against ${options.env} environment`);
  logger.info(`API URL: ${config.apiUrl}`);
  
  // Check API health first
  logger.loading('Checking API health...');
  
  if (!await checkApiHealth()) {
    throw new Error('API is not healthy. Please ensure services are running.');
  }
  
  logger.success('API is healthy');
  
  // Define test suite
  const tests = [
    { name: 'Test Authentication', fn: testAuthentication },
    { name: 'Test User Creation', fn: testUserCreation },
    { name: 'Test API Endpoints', fn: testApiEndpoints },
    // Add more tests here
  ];
  
  // Run tests
  const results: TestResult[] = [];
  const ctx = createTestContext();
  
  logger.separator();
  
  for (const test of tests) {
    const result = await runTest(test.name, test.fn, ctx, options);
    results.push(result);
    
    if (!result.passed && options.bail) {
      logger.error('Bailing on first failure');
      break;
    }
  }
  
  // Cleanup
  await ctx.cleanup();
  
  // Display results
  displayResults(results);
  
  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

async function runTest(
  name: string,
  testFn: (ctx: any) => Promise<void>,
  ctx: any,
  options: Options
): Promise<TestResult> {
  logger.info(`Running: ${name}`);
  
  try {
    const duration = await measureTime(name, async () => {
      await testFn(ctx);
    });
    
    logger.success(`✓ ${name} (${duration}ms)`);
    
    return {
      name,
      passed: true,
      duration,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error(`✗ ${name}: ${errorMessage}`);
    
    if (options.verbose && error instanceof Error && error.stack) {
      logger.debug(error.stack);
    }
    
    return {
      name,
      passed: false,
      duration: 0,
      error: errorMessage,
    };
  }
}

// Test implementations
async function testAuthentication(ctx: any) {
  const testUser = getTestUser('admin');
  
  // Test login
  const sessionToken = await authenticate(testUser.email, testUser.password);
  assertData(sessionToken, 'Session token should be returned');
  
  // Store for other tests
  ctx.sessionToken = sessionToken;
  
  // Test authenticated request
  const response = await apiRequest('/api/auth/session', {
    headers: authHeaders(sessionToken),
  });
  
  assertStatus(response, 200);
  const session = assertData(response);
  
  if (session.user?.email !== testUser.email) {
    throw new Error('Session user does not match');
  }
}

async function testUserCreation(ctx: any) {
  // TODO: Implement user creation test
  logger.debug('User creation test not implemented');
}

async function testApiEndpoints(ctx: any) {
  // TODO: Implement API endpoint tests
  logger.debug('API endpoint tests not implemented');
}

function displayResults(results: TestResult[]) {
  logger.separator();
  logger.box('Test Results');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  logger.table(
    ['Test', 'Status', 'Duration'],
    results.map(r => [
      r.name,
      r.passed ? '✓ PASS' : '✗ FAIL',
      r.duration ? `${r.duration}ms` : '-'
    ])
  );
  
  logger.separator();
  
  if (failed === 0) {
    logger.success(`All tests passed! (${passed}/${total})`);
  } else {
    logger.error(`${failed} tests failed (${passed}/${total} passed)`);
    
    // Show failed test details
    const failures = results.filter(r => !r.passed);
    if (failures.length > 0) {
      logger.separator();
      logger.error('Failed tests:');
      failures.forEach(f => {
        logger.error(`  - ${f.name}: ${f.error}`);
      });
    }
  }
}

// Run the script
main();
#!/usr/bin/env bun
/**
 * Script Test Runner
 * 
 * Runs all verification tests for the optimized scripts in proper order
 * 
 * Usage:
 *   bun run scripts/test-runner.ts [options]
 * 
 * Options:
 *   --help, -h     Show help
 *   --quick        Run only critical tests
 *   --full         Run all tests including integration
 *   --report       Generate detailed report
 */

import { 
  parseArgs, 
  printHelp, 
  logger, 
  handleError,
  withSpinner,
  confirm
} from './lib';
import { config } from './config';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  duration: number;
  error?: string;
  output?: string;
}

interface Options {
  quick: boolean;
  full: boolean;
  report: boolean;
}

// Test definitions in order of execution
const TEST_SUITES = {
  prerequisites: [
    {
      name: 'Environment validation',
      cmd: 'bun run scripts/config/environment.ts',
      critical: true,
    },
    {
      name: 'Docker availability',
      cmd: 'docker info',
      critical: true,
    },
  ],
  
  infrastructure: [
    {
      name: 'Logger utility',
      cmd: 'bun test scripts/__tests__/lib/logger.test.ts',
      critical: true,
    },
    {
      name: 'Error handler utility',
      cmd: 'bun test scripts/__tests__/lib/error-handler.test.ts',
      critical: true,
    },
    {
      name: 'CLI utilities',
      cmd: 'bun test scripts/__tests__/lib/cli-utils.test.ts',
      critical: true,
    },
  ],
  
  database: [
    {
      name: 'Database connection',
      cmd: 'bun run scripts/database/manage-database-unified.ts health',
      critical: true,
    },
    {
      name: 'Database reset (dry-run)',
      cmd: 'bun run scripts/database/reset-database-optimized.ts --env=local --dry-run',
      critical: false,
    },
  ],
  
  services: [
    {
      name: 'Service definitions',
      cmd: 'bun run scripts/config/services.ts',
      critical: false,
    },
    {
      name: 'Docker utilities',
      cmd: 'docker ps',
      critical: false,
    },
  ],
  
  auth: [
    {
      name: 'Auth configuration',
      cmd: 'bun run scripts/auth/manage-auth-unified.ts verify',
      critical: true,
    },
    {
      name: 'Auth test flow',
      cmd: 'bun run scripts/auth/manage-auth-unified.ts test --email=test@example.com',
      critical: false,
    },
  ],
  
  users: [
    {
      name: 'User list',
      cmd: 'bun run scripts/users/manage-users-unified.ts list',
      critical: false,
    },
    {
      name: 'User creation (dry-run)',
      cmd: 'bun run scripts/users/manage-users-unified.ts create --email=test@dry-run.com --role=user --dry-run',
      critical: false,
    },
  ],
  
  scripts: [
    {
      name: 'Script analysis',
      cmd: 'bun run scripts/analyze-scripts.ts',
      critical: false,
    },
  ],
};

async function main() {
  try {
    const args = parseArgs();
    
    if (args.help || args.h) {
      printHelp({
        usage: 'bun run scripts/test-runner.ts [options]',
        description: 'Run verification tests for optimized scripts',
        options: [
          { flag: '--help, -h', description: 'Show help' },
          { flag: '--quick', description: 'Run only critical tests' },
          { flag: '--full', description: 'Run all tests' },
          { flag: '--report', description: 'Generate detailed report' },
        ],
        examples: [
          'bun run scripts/test-runner.ts',
          'bun run scripts/test-runner.ts --quick',
          'bun run scripts/test-runner.ts --full --report',
        ],
      });
      process.exit(0);
    }
    
    const options: Options = {
      quick: Boolean(args.quick),
      full: Boolean(args.full),
      report: Boolean(args.report),
    };
    
    // Show test plan
    logger.box('Script Verification Test Runner');
    
    const totalTests = Object.values(TEST_SUITES).flat().length;
    const criticalTests = Object.values(TEST_SUITES).flat().filter(t => t.critical).length;
    
    logger.info(`Total tests: ${totalTests}`);
    logger.info(`Critical tests: ${criticalTests}`);
    logger.info(`Mode: ${options.quick ? 'Quick (critical only)' : options.full ? 'Full' : 'Standard'}`);
    
    if (!args.force) {
      const confirmed = await confirm('Continue with tests?');
      if (!confirmed) {
        logger.info('Tests cancelled');
        process.exit(0);
      }
    }
    
    // Run tests
    const results = await runTests(options);
    
    // Display results
    displayResults(results);
    
    // Generate report if requested
    if (options.report) {
      generateReport(results);
    }
    
    // Exit with appropriate code
    const failed = results.filter(r => !r.passed).length;
    process.exit(failed > 0 ? 1 : 0);
    
  } catch (error) {
    handleError(error);
  }
}

async function runTests(options: Options): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  for (const [category, tests] of Object.entries(TEST_SUITES)) {
    logger.separator();
    logger.info(`${category.toUpperCase()} TESTS`);
    logger.separator();
    
    for (const test of tests) {
      // Skip non-critical tests in quick mode
      if (options.quick && !test.critical) {
        continue;
      }
      
      const result = await runTest(test.name, test.cmd, category);
      results.push(result);
      
      // Stop on critical failure
      if (test.critical && !result.passed) {
        logger.error('Critical test failed! Stopping execution.');
        break;
      }
    }
  }
  
  return results;
}

async function runTest(name: string, cmd: string, category: string): Promise<TestResult> {
  const start = Date.now();
  
  return await withSpinner(`Testing: ${name}`, async () => {
    try {
      const output = execSync(cmd, {
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'test' },
        stdio: 'pipe',
      });
      
      return {
        name,
        category,
        passed: true,
        duration: Date.now() - start,
        output: output.trim(),
      };
    } catch (error: any) {
      return {
        name,
        category,
        passed: false,
        duration: Date.now() - start,
        error: error.message,
        output: error.stdout?.toString() || error.stderr?.toString(),
      };
    }
  });
}

function displayResults(results: TestResult[]) {
  logger.separator('=', 60);
  logger.box('Test Results Summary');
  
  const byCategory = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = { passed: 0, failed: 0, tests: [] };
    }
    
    acc[result.category].tests.push(result);
    if (result.passed) {
      acc[result.category].passed++;
    } else {
      acc[result.category].failed++;
    }
    
    return acc;
  }, {} as Record<string, any>);
  
  // Category summary
  logger.separator();
  logger.info('By Category:');
  
  Object.entries(byCategory).forEach(([category, data]) => {
    const total = data.passed + data.failed;
    const status = data.failed === 0 ? '✅' : '❌';
    
    logger.info(`  ${status} ${category}: ${data.passed}/${total} passed`);
  });
  
  // Overall summary
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  
  logger.separator();
  
  if (failed === 0) {
    logger.success(`All ${total} tests passed! 🎉`);
  } else {
    logger.error(`${failed} out of ${total} tests failed`);
    
    // Show failed tests
    logger.separator();
    logger.error('Failed tests:');
    
    results
      .filter(r => !r.passed)
      .forEach(result => {
        logger.error(`  ❌ ${result.category}/${result.name}`);
        if (result.error) {
          logger.error(`     ${result.error}`);
        }
      });
  }
  
  // Performance summary
  logger.separator();
  logger.info('Performance:');
  
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  logger.info(`  Total time: ${(totalDuration / 1000).toFixed(2)}s`);
  
  const slowest = results.sort((a, b) => b.duration - a.duration).slice(0, 3);
  logger.info('  Slowest tests:');
  slowest.forEach(test => {
    logger.info(`    - ${test.name}: ${(test.duration / 1000).toFixed(2)}s`);
  });
}

function generateReport(results: TestResult[]) {
  const reportsDir = join(process.cwd(), 'scripts', 'reports');
  
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = join(reportsDir, `test-report-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: config.APP_ENV,
    summary: {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      duration: results.reduce((sum, r) => sum + r.duration, 0),
    },
    results: results,
    system: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };
  
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logger.success(`\nDetailed report saved to: ${reportPath}`);
}

// Run tests
main();
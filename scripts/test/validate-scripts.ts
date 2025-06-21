#!/usr/bin/env bun
/**
 * Script Validation for Error-Free Deployment
 * Validates all management scripts are working correctly
 */

import { testLogger } from '../config/test-logger';
import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  duration?: number;
  error?: any;
  output?: string;
}

class ScriptValidator {
  private results: TestResult[] = [];
  private startTime: number = Date.now();

  async validateAllScripts(): Promise<boolean> {

    // 1. Validate environment
    await this.validateEnvironment();

    // 2. Validate database connection
    await this.validateDatabase();

    // 3. Validate management scripts
    await this.validateUserManagement();
    await this.validateDatabaseManagement();
    await this.validateAuthManagement();

    // 4. Run integration tests
    await this.runIntegrationTests();

    // 5. Generate report
    return await this.generateReport();
  }

  private async validateEnvironment() {

    const checks = [
      {
        name: 'Runtime version',
        test: () => {
          // Check for Bun or Node.js
          if (typeof Bun !== 'undefined') {
            return true; // Bun is valid
          }
          const version = process.version;
          return version.startsWith('v18') || version.startsWith('v20') || version.startsWith('v21');
        },
      },
      {
        name: 'Bun runtime',
        test: () => typeof Bun !== 'undefined',
      },
      {
        name: 'Database URL configured',
        test: () => !!DATABASE_URL,
      },
      {
        name: 'Required directories exist',
        test: () => {
          return fs.existsSync('scripts/users') &&
                 fs.existsSync('scripts/database') &&
                 fs.existsSync('scripts/auth');
        },
      },
    ];

    for (const check of checks) {
      try {
        const passed = check.test();
        this.logResult({
          name: `Environment: ${check.name}`,
          status: passed ? 'pass' : 'fail',
        });
      } catch (error) {
        this.logResult({
          name: `Environment: ${check.name}`,
          status: 'fail',
          error,
        });
      }
    }
  }

  private async validateDatabase() {

    // Check database connection
    const result = await this.runScript(
      'Database Connection',
      `DATABASE_URL="${DATABASE_URL}" bun scripts/database/manage-database-simple.ts health`
    );

    if (result.status === 'pass') {
      // Check tables exist
      await this.runScript(
        'Database Tables',
        `DATABASE_URL="${DATABASE_URL}" bun scripts/database/manage-database-simple.ts tables`
      );
    }
  }

  private async validateUserManagement() {

    // List users
    await this.runScript(
      'List Users',
      `DATABASE_URL="${DATABASE_URL}" bun scripts/users/manage-users.ts list`
    );

    // Test user lifecycle
    const testEmail = `validate-${Date.now()}@test.com`;
    
    // Create
    const createResult = await this.runScript(
      'Create Test User',
      `DATABASE_URL="${DATABASE_URL}" bun scripts/users/manage-users.ts create --email=${testEmail} --password=Test123! --role=nurse --name="Validation User"`
    );

    if (createResult.status === 'pass') {
      // Update
      await this.runScript(
        'Update User Role',
        `DATABASE_URL="${DATABASE_URL}" bun scripts/users/manage-users.ts update ${testEmail} doctor`
      );

      // Delete
      await this.runScript(
        'Delete Test User',
        `DATABASE_URL="${DATABASE_URL}" bun scripts/users/manage-users.ts delete ${testEmail} --force`
      );
    }
  }

  private async validateDatabaseManagement() {

    const commands = [
      { name: 'Database Info', cmd: 'info' },
      { name: 'Database Health', cmd: 'health' },
      { name: 'List Tables', cmd: 'tables' },
    ];

    for (const command of commands) {
      await this.runScript(
        command.name,
        `DATABASE_URL="${DATABASE_URL}" bun scripts/database/manage-database-simple.ts ${command.cmd}`
      );
    }
  }

  private async validateAuthManagement() {

    // List sessions
    await this.runScript(
      'List Sessions',
      `DATABASE_URL="${DATABASE_URL}" bun scripts/auth/manage-auth.ts sessions`
    );

    // Verify OAuth
    await this.runScript(
      'Verify OAuth Config',
      `DATABASE_URL="${DATABASE_URL}" bun scripts/auth/manage-auth.ts verify`
    );
  }

  private async runIntegrationTests() {

    // Test complete healthcare setup
    const result = await this.runScript(
      'Healthcare Setup',
      `DATABASE_URL="${DATABASE_URL}" bun scripts/users/manage-users.ts setup-demo`,
      { timeout: 30000 }
    );

    if (result.status === 'pass') {
      // Verify created data
      await this.runScript(
        'Verify Demo Data',
        `DATABASE_URL="${DATABASE_URL}" bun scripts/users/manage-users.ts list`
      );
    }
  }

  private async runScript(
    name: string,
    command: string,
    options: { timeout?: number } = {}
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const output = execSync(command, {
        encoding: 'utf8',
        timeout: options.timeout || 10000,
      });
      
      const duration = Date.now() - startTime;
      const result: TestResult = {
        name,
        status: 'pass',
        duration,
        output: output.substring(0, 500),
      };
      
      this.logResult(result);
      await testLogger.logTest(name, {
        status: 'pass',
        duration,
        testSuite: 'Script Validation',
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        name,
        status: 'fail',
        duration,
        error: error.message || error,
      };
      
      this.logResult(result);
      await testLogger.logTest(name, {
        status: 'fail',
        duration,
        error,
        testSuite: 'Script Validation',
      });
      
      return result;
    }
  }

  private logResult(result: TestResult) {
    this.results.push(result);
    
    const icon = result.status === 'pass' ? '✅' : '❌';
    const color = result.status === 'pass' ? 'green' : 'red';

    if (result.error) {

    }
  }

  private async generateReport(): Promise<boolean> {
    const duration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const total = this.results.length;

    if (failed > 0) {

    }

    if (failed > 0) {

      this.results
        .filter(r => r.status === 'fail')
        .forEach(r => {

          if (r.error) {

          }
        });
    }

    // Log to Docker
    await testLogger.logTestRunComplete({
      totalSuites: 1,
      totalTests: total,
      passed,
      failed,
      duration,
    });

    // Create deployment readiness file
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: DATABASE_URL,
      results: {
        total,
        passed,
        failed,
        duration,
      },
      deploymentReady: failed === 0,
      failedChecks: this.results.filter(r => r.status === 'fail').map(r => ({
        name: r.name,
        error: r.error,
      })),
    };

    fs.writeFileSync(
      'DEPLOYMENT_VALIDATION_REPORT.json',
      JSON.stringify(report, null, 2)
    );

    return failed === 0;
  }
}

// Main execution
async function main() {
  const validator = new ScriptValidator();
  
  try {
    const success = await validator.validateAllScripts();
    
    if (success) {

      process.exit(0);
    } else {

      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Validation error:'), error);
    process.exit(1);
  }
}

main();
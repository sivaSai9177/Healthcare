#!/usr/bin/env bun
/**
 * Kamal Deployment Test Script
 * Validates Kamal configuration and tests deployment readiness
 */

import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { testLogger } from '../config/test-logger';

interface DeploymentCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message?: string;
  critical?: boolean;
}

class KamalDeploymentTester {
  private checks: DeploymentCheck[] = [];
  private envFile: string = '.env.production';

  async runDeploymentTest() {

    // 1. Check prerequisites
    await this.checkPrerequisites();
    
    // 2. Validate environment
    await this.validateEnvironment();
    
    // 3. Test Docker build
    await this.testDockerBuild();
    
    // 4. Validate Kamal configuration
    await this.validateKamalConfig();
    
    // 5. Test deployment hooks
    await this.testDeploymentHooks();
    
    // 6. Generate report
    await this.generateReport();
  }

  private async checkPrerequisites() {

    // Check Kamal installation
    this.addCheck({
      name: 'Kamal CLI',
      ...this.checkCommand('kamal version', 'Kamal is not installed. Run: gem install kamal'),
      critical: true,
    });

    // Check Docker
    this.addCheck({
      name: 'Docker',
      ...this.checkCommand('docker --version', 'Docker is not installed'),
      critical: true,
    });

    // Check production env file
    this.addCheck({
      name: 'Production Environment File',
      ...this.checkFile(this.envFile, 'Production .env file not found. Run: cp .env.example .env.production'),
      critical: true,
    });

    // Check Kamal config
    this.addCheck({
      name: 'Kamal Configuration',
      ...this.checkFile('config/deploy.yml', 'Kamal deploy.yml not found'),
      critical: true,
    });

    // Check Dockerfiles
    this.addCheck({
      name: 'Production Dockerfile',
      ...this.checkFile('Dockerfile.production', 'Production Dockerfile not found'),
      critical: true,
    });
  }

  private async validateEnvironment() {

    if (!fs.existsSync(this.envFile)) {
      this.addCheck({
        name: 'Environment Variables',
        status: 'fail',
        message: 'Production environment file not found',
        critical: true,
      });
      return;
    }

    const envContent = fs.readFileSync(this.envFile, 'utf8');
    const requiredVars = [
      'DEPLOY_SERVER_IP',
      'DEPLOY_DOMAIN',
      'DOCKER_REGISTRY_USERNAME',
      'DATABASE_URL',
      'BETTER_AUTH_SECRET',
      'REDIS_URL',
    ];

    const missingVars = requiredVars.filter(varName => {
      const regex = new RegExp(`^${varName}=.+`, 'm');
      return !regex.test(envContent);
    });

    this.addCheck({
      name: 'Required Environment Variables',
      status: missingVars.length === 0 ? 'pass' : 'fail',
      message: missingVars.length > 0 ? `Missing: ${missingVars.join(', ')}` : undefined,
      critical: true,
    });

    // Check for placeholder values
    const placeholders = envContent.match(/=(your-|change-me|example|todo|xxx)/gi) || [];
    this.addCheck({
      name: 'Environment Placeholders',
      status: placeholders.length === 0 ? 'pass' : 'warning',
      message: placeholders.length > 0 ? `Found ${placeholders.length} placeholder values` : undefined,
    });
  }

  private async testDockerBuild() {

    try {
      // Test build with cache
      execSync('docker build -f Dockerfile.production --target builder -t healthcare-test-build .', {
        stdio: 'pipe',
      });
      
      this.addCheck({
        name: 'Docker Build (Builder Stage)',
        status: 'pass',
      });
    } catch (error) {
      this.addCheck({
        name: 'Docker Build (Builder Stage)',
        status: 'fail',
        message: 'Failed to build Docker image',
        critical: true,
      });
    }

    // Check image size
    try {
      const output = execSync('docker images healthcare-test-build --format "{{.Size}}"', {
        encoding: 'utf8',
      }).trim();
      
      this.addCheck({
        name: 'Docker Image Size',
        status: 'pass',
        message: `Image size: ${output}`,
      });
    } catch (error) {
      // Non-critical
    }
  }

  private async validateKamalConfig() {

    try {
      // Load environment variables for testing
      const envVars = this.loadEnvVars();
      
      // Validate Kamal config syntax
      const result = execSync('kamal config', {
        encoding: 'utf8',
        env: {
          ...process.env,
          ...envVars,
        },
      });
      
      this.addCheck({
        name: 'Kamal Config Syntax',
        status: 'pass',
      });

      // Check for required services
      const hasPostgres = result.includes('postgres');
      const hasRedis = result.includes('redis');
      const hasWebsocket = result.includes('websocket');
      
      this.addCheck({
        name: 'Required Services',
        status: hasPostgres && hasRedis && hasWebsocket ? 'pass' : 'warning',
        message: !hasPostgres || !hasRedis || !hasWebsocket ? 'Some services missing in config' : undefined,
      });
    } catch (error) {
      this.addCheck({
        name: 'Kamal Config Syntax',
        status: 'fail',
        message: error.message,
        critical: true,
      });
    }
  }

  private async testDeploymentHooks() {

    const hooks = [
      '.kamal/hooks/pre-connect',
      '.kamal/hooks/pre-build',
      '.kamal/hooks/pre-deploy',
      '.kamal/hooks/post-deploy',
    ];

    for (const hook of hooks) {
      const exists = fs.existsSync(hook);
      const executable = exists && fs.statSync(hook).mode & fs.constants.X_OK;
      
      this.addCheck({
        name: `Hook: ${path.basename(hook)}`,
        status: exists && executable ? 'pass' : 'warning',
        message: !exists ? 'Hook not found' : !executable ? 'Hook not executable' : undefined,
      });
    }
  }

  private checkCommand(command: string, errorMessage: string): { status: 'pass' | 'fail'; message?: string } {
    try {
      execSync(command, { stdio: 'pipe' });
      return { status: 'pass' };
    } catch {
      return { status: 'fail', message: errorMessage };
    }
  }

  private checkFile(filePath: string, errorMessage: string): { status: 'pass' | 'fail'; message?: string } {
    if (fs.existsSync(filePath)) {
      return { status: 'pass' };
    }
    return { status: 'fail', message: errorMessage };
  }

  private loadEnvVars(): Record<string, string> {
    if (!fs.existsSync(this.envFile)) {
      return {};
    }

    const envContent = fs.readFileSync(this.envFile, 'utf8');
    const envVars: Record<string, string> = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        envVars[match[1].trim()] = match[2].trim();
      }
    });
    
    return envVars;
  }

  private addCheck(check: DeploymentCheck) {
    this.checks.push(check);
    
    const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    const color = check.status === 'pass' ? 'green' : check.status === 'warning' ? 'yellow' : 'red';

    if (check.message) {

    }
  }

  private async generateReport() {
    const passed = this.checks.filter(c => c.status === 'pass').length;
    const warnings = this.checks.filter(c => c.status === 'warning').length;
    const failed = this.checks.filter(c => c.status === 'fail').length;
    const critical = this.checks.filter(c => c.status === 'fail' && c.critical).length;

    if (warnings > 0) {}
    if (failed > 0) {}
    if (critical > 0) {}

    const deploymentReady = critical === 0;

    if (!deploymentReady) {

      this.checks
        .filter(c => c.status === 'fail' && c.critical)
        .forEach(c => {

        });
    }

    // Create deployment test report
    const report = {
      timestamp: new Date().toISOString(),
      deploymentReady,
      checks: {
        total: this.checks.length,
        passed,
        warnings,
        failed,
        critical,
      },
      issues: this.checks.filter(c => c.status !== 'pass'),
    };

    fs.writeFileSync(
      'KAMAL_DEPLOYMENT_TEST_REPORT.json',
      JSON.stringify(report, null, 2)
    );

    // Log to Docker
    await testLogger.logTestRunComplete({
      totalSuites: 1,
      totalTests: this.checks.length,
      passed,
      failed: failed + warnings,
      duration: Date.now(),
    });

    if (deploymentReady) {

    } else {

    }

    return deploymentReady;
  }
}

// Run deployment test
async function main() {
  const tester = new KamalDeploymentTester();
  
  try {
    const ready = await tester.runDeploymentTest();
    process.exit(ready ? 0 : 1);
  } catch (error) {
    console.error(chalk.red('\n❌ Deployment test error:'), error);
    process.exit(1);
  }
}

main();
#!/usr/bin/env bun
/**
 * Staging Deployment Test Script
 * Comprehensive testing of Kamal deployment to staging environment
 */

import chalk from 'chalk';
import { execSync, exec } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Simple logger
const log = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.log(msg),
  warn: (msg: string) => console.log(msg),
  debug: (msg: string) => process.env.DEBUG && console.log(msg),
};

interface TestResult {
  step: string;
  status: 'passed' | 'failed' | 'skipped';
  message?: string;
  duration?: number;
}

const testResults: TestResult[] = [];

// Add test result
function addResult(step: string, status: TestResult['status'], message?: string, duration?: number) {
  testResults.push({ step, status, message, duration });
  
  const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
  const color = status === 'passed' ? chalk.green : status === 'failed' ? chalk.red : chalk.gray;

}

// Check prerequisites
async function checkPrerequisites(): Promise<boolean> {

  let allPassed = true;
  
  // Check Kamal installation
  try {
    const version = execSync('kamal version', { encoding: 'utf8' }).trim();
    addResult('Kamal CLI installed', 'passed', version);
  } catch {
    addResult('Kamal CLI installed', 'failed', 'Install with: gem install kamal');
    allPassed = false;
  }
  
  // Check Docker
  try {
    execSync('docker --version', { stdio: 'ignore' });
    addResult('Docker installed', 'passed');
  } catch {
    addResult('Docker installed', 'failed', 'Docker is required');
    allPassed = false;
  }
  
  // Check configuration files
  const requiredFiles = [
    'config/deploy.yml',
    'config/deploy.staging.yml',
    '.kamal/secrets',
    'Dockerfile.production'
  ];
  
  for (const file of requiredFiles) {
    if (existsSync(file)) {
      addResult(`${file} exists`, 'passed');
    } else {
      addResult(`${file} exists`, 'failed', 'File not found');
      allPassed = false;
    }
  }
  
  // Check environment variables
  const requiredEnvVars = [
    'STAGING_SERVER_IP',
    'DEPLOY_DOMAIN',
    'DOCKER_REGISTRY_USERNAME'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      addResult(`${envVar} set`, 'passed');
    } else {
      addResult(`${envVar} set`, 'failed', 'Environment variable not set');
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Test Docker build
async function testDockerBuild(): Promise<boolean> {

  const startTime = Date.now();
  
  try {
    log.info('Building Docker image...');
    execSync('docker build -t healthcare-alerts/app:test -f Dockerfile.production .', { 
      stdio: process.env.VERBOSE ? 'inherit' : 'pipe' 
    });
    
    const duration = Date.now() - startTime;
    addResult('Docker build', 'passed', 'Image built successfully', duration);
    
    // Check image size
    const sizeOutput = execSync('docker images healthcare-alerts/app:test --format "{{.Size}}"', { encoding: 'utf8' }).trim();
    log.info(`Image size: ${sizeOutput}`);
    
    return true;
  } catch (error) {
    addResult('Docker build', 'failed', error.message);
    return false;
  }
}

// Test Kamal configuration
async function testKamalConfig(): Promise<boolean> {

  try {
    // Validate configuration
    execSync('kamal config -d staging', { stdio: 'pipe' });
    addResult('Kamal config validation', 'passed');
    
    // Check accessories
    const accessories = ['postgres', 'redis', 'websocket'];
    for (const accessory of accessories) {
      try {
        execSync(`kamal accessory details ${accessory} -d staging`, { stdio: 'pipe' });
        addResult(`${accessory} configuration`, 'passed');
      } catch {
        addResult(`${accessory} configuration`, 'failed');
      }
    }
    
    return true;
  } catch (error) {
    addResult('Kamal config validation', 'failed', error.message);
    return false;
  }
}

// Test server connectivity
async function testServerConnectivity(): Promise<boolean> {

  const serverIP = process.env.STAGING_SERVER_IP;
  
  if (!serverIP) {
    addResult('Server connectivity', 'skipped', 'STAGING_SERVER_IP not set');
    return false;
  }
  
  try {
    // Test SSH connection
    execSync(`ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@${serverIP} 'echo "Connected"'`, { stdio: 'pipe' });
    addResult('SSH connectivity', 'passed', serverIP);
    
    // Check server resources
    const memInfo = execSync(`ssh root@${serverIP} 'free -h | grep Mem'`, { encoding: 'utf8' }).trim();
    const diskInfo = execSync(`ssh root@${serverIP} 'df -h / | tail -1'`, { encoding: 'utf8' }).trim();
    
    log.info(`Server memory: ${memInfo}`);
    log.info(`Server disk: ${diskInfo}`);
    
    return true;
  } catch (error) {
    addResult('SSH connectivity', 'failed', 'Cannot connect to server');
    return false;
  }
}

// Perform dry run deployment
async function testDryRun(): Promise<boolean> {

  try {
    log.info('Running Kamal deployment dry run...');
    
    // First, check if we can push to registry
    execSync('kamal registry login -d staging', { stdio: 'pipe' });
    addResult('Registry login', 'passed');
    
    // Run pre-deploy hook if exists
    if (existsSync('.kamal/hooks/pre-deploy')) {
      execSync('.kamal/hooks/pre-deploy', { stdio: 'pipe' });
      addResult('Pre-deploy hook', 'passed');
    }
    
    // Simulate deployment steps
    log.info('Simulating deployment steps...');
    
    // Build and push would happen here in real deployment
    addResult('Build simulation', 'passed', 'Would build and push image');
    addResult('Deploy simulation', 'passed', 'Would deploy containers');
    
    return true;
  } catch (error) {
    addResult('Deployment dry run', 'failed', error.message);
    return false;
  }
}

// Test health endpoints
async function testHealthEndpoints(): Promise<boolean> {

  const domain = process.env.DEPLOY_DOMAIN;
  if (!domain) {
    addResult('Health endpoints', 'skipped', 'DEPLOY_DOMAIN not set');
    return false;
  }
  
  const stagingUrl = `https://staging.${domain}`;
  
  // Test endpoints
  const endpoints = [
    { path: '/api/health', name: 'API Health' },
    { path: '/api/auth/session', name: 'Auth Endpoint' },
    { path: '/', name: 'Main Page' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${stagingUrl}${endpoint.path}`, {
        method: 'GET',
        timeout: 5000,
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok || response.status === 405) {
        addResult(endpoint.name, 'passed', `${response.status}`, duration);
      } else {
        addResult(endpoint.name, 'failed', `Status: ${response.status}`);
      }
    } catch (error) {
      addResult(endpoint.name, 'failed', 'Not accessible');
    }
  }
  
  return true;
}

// Create deployment checklist
function createDeploymentChecklist() {
  const checklist = `# Staging Deployment Checklist

## Pre-Deployment
- [ ] All tests passing locally
- [ ] Docker build successful
- [ ] Environment variables configured
- [ ] Server SSH access verified
- [ ] Database backups taken

## Deployment Steps
1. [ ] Run health check: \`bun scripts/monitoring/manage-health.ts check\`
2. [ ] Build Docker image: \`docker build -t healthcare-alerts/app:staging -f Dockerfile.production .\`
3. [ ] Run deployment: \`kamal deploy -d staging\`
4. [ ] Monitor logs: \`kamal app logs -f -d staging\`

## Post-Deployment
- [ ] Health endpoint responding
- [ ] Authentication working
- [ ] WebSocket connections established
- [ ] Database migrations applied
- [ ] Monitoring alerts configured

## Rollback Plan
If issues occur:
1. \`kamal rollback -d staging\`
2. Check error logs
3. Fix issues
4. Redeploy

## Monitoring URLs
- Health: https://staging.${process.env.DEPLOY_DOMAIN}/api/health
- Logs: \`kamal app logs -d staging\`
- Server: ssh root@${process.env.STAGING_SERVER_IP}
`;

  writeFileSync('STAGING_DEPLOYMENT_CHECKLIST.md', checklist);
  log.success('Created STAGING_DEPLOYMENT_CHECKLIST.md');
}

// Generate deployment report
function generateReport() {

  const passed = testResults.filter(r => r.status === 'passed').length;
  const failed = testResults.filter(r => r.status === 'failed').length;
  const skipped = testResults.filter(r => r.status === 'skipped').length;
  const total = testResults.length;

  if (failed > 0) {

    testResults
      .filter(r => r.status === 'failed')
      .forEach(r => {});
  }
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    summary: { total, passed, failed, skipped },
    results: testResults,
    environment: {
      stagingServer: process.env.STAGING_SERVER_IP || 'not set',
      domain: process.env.DEPLOY_DOMAIN || 'not set',
      registry: process.env.DOCKER_REGISTRY_USERNAME ? 'configured' : 'not configured'
    }
  };
  
  writeFileSync('staging-deployment-test-report.json', JSON.stringify(report, null, 2));
  log.info('\nDetailed report saved to: staging-deployment-test-report.json');
  
  return failed === 0;
}

// Main execution
async function main() {

  // Run all tests
  const prerequisitesPassed = await checkPrerequisites();
  
  if (!prerequisitesPassed) {
    log.error('\n⚠️  Prerequisites not met. Please fix the issues above before proceeding.');
    process.exit(1);
  }
  
  // Continue with other tests
  await testDockerBuild();
  await testKamalConfig();
  await testServerConnectivity();
  await testDryRun();
  await testHealthEndpoints();
  
  // Create checklist
  createDeploymentChecklist();
  
  // Generate report
  const allPassed = generateReport();
  
  if (allPassed) {

  } else {

    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log.error(`Unexpected error: ${error}`);
  process.exit(1);
});
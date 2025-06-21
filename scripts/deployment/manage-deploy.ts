#!/usr/bin/env bun
/**
 * Deployment Management Script
 * Handles builds, deployments, environment management, and release coordination
 */

import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

// Simple logger
const log = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.log(msg),
  warn: (msg: string) => console.log(msg),
  debug: (msg: string) => process.env.DEBUG && console.log(msg),
};

interface DeployAction {
  action: 'build' | 'deploy' | 'rollback' | 'status' | 'logs' | 'env' | 'eas' | 'preview';
  environment?: 'development' | 'staging' | 'production';
  platform?: 'web' | 'ios' | 'android' | 'all';
  force?: boolean;
  follow?: boolean;
}

// Parse command line arguments
function parseArgs(): DeployAction {
  const args = process.argv.slice(2);
  const action = args[0] as DeployAction['action'];
  
  if (!action || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const envIndex = args.findIndex(arg => arg.startsWith('--env='));
  const environment = envIndex !== -1 ? args[envIndex].split('=')[1] as DeployAction['environment'] : 'staging';
  
  const platformIndex = args.findIndex(arg => arg.startsWith('--platform='));
  const platform = platformIndex !== -1 ? args[platformIndex].split('=')[1] as DeployAction['platform'] : 'all';
  
  const force = args.includes('--force') || args.includes('-f');
  const follow = args.includes('--follow');

  return { action, environment, platform, force, follow };
}

function printHelp() {

}

// Check prerequisites
async function checkPrerequisites() {
  const checks = {
    docker: { command: 'docker --version', name: 'Docker' },
    kamal: { command: 'kamal version', name: 'Kamal' },
    eas: { command: 'eas --version', name: 'EAS CLI' },
    expo: { command: 'expo --version', name: 'Expo CLI' },
  };
  
  const missing = [];
  
  for (const [key, check] of Object.entries(checks)) {
    try {
      execSync(check.command, { stdio: 'ignore' });
    } catch {
      missing.push(check.name);
    }
  }
  
  if (missing.length > 0) {
    log.warn(`Missing prerequisites: ${missing.join(', ')}`);
    log.info('Install missing tools before proceeding');
    return false;
  }
  
  return true;
}

// Build application
async function buildApplication(platform: DeployAction['platform']) {
  log.info(`Building application for ${platform}...`);
  
  try {
    switch (platform) {
      case 'web':
        log.info('Building web version...');
        execSync('npm run build:web', { stdio: 'inherit' });
        log.success('Web build completed');
        break;
        
      case 'ios':
        log.info('Building iOS version with EAS...');
        execSync('eas build --platform ios --profile production', { stdio: 'inherit' });
        log.success('iOS build submitted to EAS');
        break;
        
      case 'android':
        log.info('Building Android version with EAS...');
        execSync('eas build --platform android --profile production', { stdio: 'inherit' });
        log.success('Android build submitted to EAS');
        break;
        
      case 'all':
        await buildApplication('web');
        await buildApplication('ios');
        await buildApplication('android');
        break;
    }
    
    // Build Docker image for web deployment
    if (platform === 'web' || platform === 'all') {
      log.info('Building Docker image...');
      execSync('docker build -t healthcare-app:latest -f Dockerfile.production .', { stdio: 'inherit' });
      log.success('Docker image built successfully');
    }
    
  } catch (error) {
    log.error(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Deploy with Kamal
async function deployWithKamal(environment: DeployAction['environment'], force: boolean) {
  if (!force && environment === 'production') {

    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  log.info(`Deploying to ${environment} with Kamal...`);
  
  try {
    // For staging, use the -d flag instead of -c
    let deployCommand: string;
    if (environment === 'staging') {
      deployCommand = 'kamal deploy -d staging';
      
      // Load staging environment
      if (existsSync('.env.staging')) {
        log.info('Loading staging environment...');
        const stagingEnv = readFileSync('.env.staging', 'utf8');
        stagingEnv.split('\n').forEach(line => {
          const [key, value] = line.split('=');
          if (key && value && !key.startsWith('#')) {
            process.env[key.trim()] = value.trim();
          }
        });
      } else {
        log.error('.env.staging not found');
        log.info('Run: ./scripts/deployment/setup-staging.sh');
        return;
      }
      
      // Source Kamal secrets
      if (existsSync('.kamal/secrets')) {
        log.info('Loading Kamal secrets...');
        execSync('source .kamal/secrets', { shell: '/bin/bash' });
      }
    } else {
      // Check Kamal configuration for other environments
      const kamalConfig = `config/deploy.${environment}.yml`;
      if (!existsSync(kamalConfig)) {
        log.error(`Kamal config not found: ${kamalConfig}`);
        log.info('Creating default configuration...');
        createKamalConfig(environment);
        return;
      }
      deployCommand = `kamal deploy -c ${kamalConfig}`;
    }
    
    // Run pre-deploy checks
    log.info('Running pre-deploy checks...');
    execSync(`bun scripts/monitoring/manage-health.ts check`, { stdio: 'inherit' });
    
    // Build Docker image
    log.info('Building Docker image...');
    execSync(`docker build -t healthcare-alerts/app:${environment} -f Dockerfile.production .`, { stdio: 'inherit' });
    
    // Deploy with Kamal
    log.info('Starting Kamal deployment...');
    execSync(deployCommand, { stdio: 'inherit', shell: '/bin/bash' });
    
    log.success(`Deployment to ${environment} completed!`);
    
    // Post-deploy verification
    log.info('Running post-deploy verification...');
    await verifyDeployment(environment);
    
  } catch (error) {
    log.error(`Deployment failed: ${error.message}`);
    
    // Offer rollback

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    readline.question('', (answer) => {
      readline.close();
      if ((answer as string).toLowerCase() === 'y') {
        rollbackDeployment(environment);
      }
    });
  }
}

// Create default Kamal configuration
function createKamalConfig(environment: DeployAction['environment']) {
  const config = `# Kamal deployment configuration for ${environment}
service: healthcare-app

image: healthcare/app

servers:
  web:
    hosts:
      - ${environment}.healthcare-app.com
    labels:
      traefik.http.routers.healthcare.rule: Host(\`${environment}.healthcare-app.com\`)
    options:
      network: healthcare-network

registry:
  server: ghcr.io
  username: 
    - KAMAL_REGISTRY_USERNAME
  password:
    - KAMAL_REGISTRY_PASSWORD

env:
  clear:
    NODE_ENV: ${environment}
    PORT: 3000
  secret:
    - DATABASE_URL
    - BETTER_AUTH_SECRET
    - REDIS_URL
    - GOOGLE_CLIENT_ID
    - GOOGLE_CLIENT_SECRET

accessories:
  postgres:
    image: postgres:16-alpine
    host: ${environment}.healthcare-app.com
    port: 5432
    env:
      clear:
        POSTGRES_DB: healthcare_${environment}
      secret:
        - POSTGRES_USER
        - POSTGRES_PASSWORD
    directories:
      - data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    host: ${environment}.healthcare-app.com
    port: 6379
    cmd: redis-server --requirepass \${REDIS_PASSWORD}
    env:
      secret:
        - REDIS_PASSWORD

healthcheck:
  path: /api/health
  port: 3000
  max_attempts: 10
  interval: 10s

traefik:
  options:
    publish:
      - "443:443"
    volume:
      - "/letsencrypt/acme.json:/letsencrypt/acme.json"
  args:
    entryPoints.web.address: ":80"
    entryPoints.websecure.address: ":443"
    certificatesResolvers.letsencrypt.acme.email: admin@healthcare-app.com
    certificatesResolvers.letsencrypt.acme.storage: /letsencrypt/acme.json
    certificatesResolvers.letsencrypt.acme.httpchallenge.entrypoint: web

# Deployment hooks
before_deploy:
  - echo "Running pre-deployment tasks..."
  - docker run --rm healthcare-app:latest bun scripts/database/manage-database-simple.ts migrate

after_deploy:
  - echo "Running post-deployment tasks..."
  - curl -X POST https://api.posthog.com/capture/ -d '{"api_key":"$POSTHOG_API_KEY","event":"deployment","properties":{"environment":"${environment}"}}'
`;

  writeFileSync(`config/deploy.${environment}.yml`, config);
  log.success(`Created Kamal configuration: config/deploy.${environment}.yml`);
  log.warn('Please update the configuration with your actual server details and credentials');
}

// Verify deployment
async function verifyDeployment(environment: DeployAction['environment']) {
  const urls = {
    development: 'https://dev.healthcare-app.com',
    staging: 'https://staging.healthcare-app.com',
    production: 'https://healthcare-app.com',
  };
  
  const url = urls[environment];
  
  try {
    log.info(`Verifying deployment at ${url}...`);
    
    // Check health endpoint
    const healthResponse = await fetch(`${url}/api/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    log.success('Health check passed');
    log.debug(`Health data: ${JSON.stringify(healthData)}`);
    
    // Check main page
    const mainResponse = await fetch(url);
    if (!mainResponse.ok) {
      throw new Error(`Main page check failed: ${mainResponse.status}`);
    }
    
    log.success('Main page accessible');
    
    // Run smoke tests
    log.info('Running smoke tests...');
    execSync(`npm run test:e2e -- --env=${environment}`, { stdio: 'inherit' });
    
    log.success('Deployment verification completed!');
    
  } catch (error) {
    log.error(`Deployment verification failed: ${error.message}`);
    throw error;
  }
}

// Rollback deployment
async function rollbackDeployment(environment: DeployAction['environment']) {
  log.info(`Rolling back ${environment} deployment...`);
  
  try {
    const kamalConfig = `config/deploy.${environment}.yml`;
    execSync(`kamal rollback -c ${kamalConfig}`, { stdio: 'inherit' });
    log.success('Rollback completed');
  } catch (error) {
    log.error(`Rollback failed: ${error.message}`);
    process.exit(1);
  }
}

// Check deployment status
async function checkDeploymentStatus() {
  log.info('Checking deployment status...');
  
  try {
    // Check Kamal status

    execSync('kamal app details', { stdio: 'inherit' });
    
    // Check running containers

    execSync('kamal app containers', { stdio: 'inherit' });
    
    // Check each environment
    const environments = ['production', 'staging', 'development'];

    for (const env of environments) {
      process.stdout.write(`${env.padEnd(15)}`);
      
      try {
        await verifyDeployment(env as DeployAction['environment']);

      } catch {

      }
    }
    
  } catch (error) {
    log.error(`Status check failed: ${error.message}`);
  }
}

// View deployment logs
async function viewDeploymentLogs(follow: boolean) {
  log.info('Fetching deployment logs...');
  
  try {
    if (follow) {
      // Follow logs in real-time
      const child = spawn('kamal', ['app', 'logs', '-f'], { stdio: 'inherit' });
      
      process.on('SIGINT', () => {
        child.kill();
        process.exit(0);
      });
    } else {
      // Show recent logs
      execSync('kamal app logs --lines 100', { stdio: 'inherit' });
    }
  } catch (error) {
    log.error(`Failed to fetch logs: ${error.message}`);
  }
}

// Manage environment variables
async function manageEnvironmentVariables(environment: DeployAction['environment']) {
  log.info(`Managing environment variables for ${environment}...`);
  
  const envFile = `.env.${environment}`;
  
  if (!existsSync(envFile)) {
    log.warn(`Environment file not found: ${envFile}`);
    log.info('Creating template...');
    
    const template = `# ${environment.toUpperCase()} Environment Variables
# Database
DATABASE_URL=postgres://user:pass@host:5432/healthcare_${environment}

# Redis
REDIS_URL=redis://:password@host:6379

# Auth
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=https://${environment}.healthcare-app.com

# API URLs
EXPO_PUBLIC_API_URL=https://${environment}.healthcare-app.com
EXPO_PUBLIC_WS_URL=wss://${environment}.healthcare-app.com

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=

# Monitoring
POSTHOG_API_KEY=
SENTRY_DSN=
`;
    
    writeFileSync(envFile, template);
    log.success(`Created environment template: ${envFile}`);
  }
  
  // Validate environment variables
  log.info('Validating environment variables...');
  
  const requiredVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'BETTER_AUTH_SECRET',
    'EXPO_PUBLIC_API_URL',
  ];
  
  const envContent = readFileSync(envFile, 'utf8');
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=\n`)) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    log.error(`Missing required environment variables: ${missing.join(', ')}`);
    log.info(`Please update ${envFile} before deploying`);
  } else {
    log.success('All required environment variables are set');
  }
  
  // Push to Kamal
  if (missing.length === 0) {
    log.info('Pushing environment variables to Kamal...');
    execSync(`kamal env push -c config/deploy.${environment}.yml`, { stdio: 'inherit' });
    log.success('Environment variables updated');
  }
}

// EAS Build management
async function manageEASBuild(platform: DeployAction['platform']) {
  log.info(`Managing EAS builds for ${platform}...`);
  
  try {
    // Use the dedicated EAS management script
    const easScript = join(__dirname, 'manage-eas.ts');
    
    if (!existsSync(easScript)) {
      log.error('EAS management script not found');
      log.info('Please ensure manage-eas.ts exists in the deployment directory');
      return;
    }
    
    // Show build status
    log.info('Checking build status...');
    execSync(`bun ${easScript} status`, { stdio: 'inherit' });
    
    // Offer build options

  } catch (error) {
    log.error(`EAS management failed: ${error.message}`);
  }
}

// Deploy preview build
async function deployPreview() {
  log.info('Deploying preview build...');
  
  try {
    // Build for preview
    log.info('Building preview version...');
    execSync('eas build --profile preview --platform all', { stdio: 'inherit' });
    
    // Wait for builds to complete
    log.info('Waiting for builds to complete...');
    execSync('eas build:wait', { stdio: 'inherit' });
    
    // Submit to internal testing
    log.info('Submitting to internal testing...');
    execSync('eas submit --profile preview', { stdio: 'inherit' });
    
    log.success('Preview deployment completed!');
    
    // Get preview URLs

    execSync('eas build:list --platform all --limit 1', { stdio: 'inherit' });
    
  } catch (error) {
    log.error(`Preview deployment failed: ${error.message}`);
  }
}

// Main execution
async function main() {
  const { action, environment, platform, force, follow } = parseArgs();

  // Check prerequisites for certain actions
  if (['deploy', 'rollback', 'eas'].includes(action)) {
    const ready = await checkPrerequisites();
    if (!ready && !force) {
      log.error('Prerequisites not met. Install missing tools or use --force to skip');
      process.exit(1);
    }
  }
  
  try {
    switch (action) {
      case 'build':
        await buildApplication(platform);
        break;
        
      case 'deploy':
        await deployWithKamal(environment, force);
        break;
        
      case 'rollback':
        await rollbackDeployment(environment);
        break;
        
      case 'status':
        await checkDeploymentStatus();
        break;
        
      case 'logs':
        await viewDeploymentLogs(follow);
        break;
        
      case 'env':
        await manageEnvironmentVariables(environment);
        break;
        
      case 'eas':
        await manageEASBuild(platform);
        break;
        
      case 'preview':
        await deployPreview();
        break;
        
      default:
        log.error(`Unknown action: ${action}`);
        printHelp();
        process.exit(1);
    }
    
    log.success('\nDeployment management completed successfully!');
  } catch (error) {
    log.error(`Deployment operation failed: ${error}`);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log.error(`Unexpected error: ${error}`);
  process.exit(1);
});
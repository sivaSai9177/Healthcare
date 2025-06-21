#!/usr/bin/env bun
/**
 * EAS Build Management Script
 * Comprehensive EAS Build and Submit management for the Healthcare Alert System
 */

import chalk from 'chalk';
import { execSync, exec } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

// Simple logger
const log = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.log(msg),
  warn: (msg: string) => console.log(msg),
  debug: (msg: string) => process.env.DEBUG && console.log(msg),
};

interface EASAction {
  action: 'setup' | 'build' | 'list' | 'submit' | 'update' | 'credentials' | 'metadata' | 'status';
  platform?: 'ios' | 'android' | 'all';
  profile?: 'development' | 'preview' | 'production';
  local?: boolean;
  clear?: boolean;
  message?: string;
}

// Parse command line arguments
function parseArgs(): EASAction {
  const args = process.argv.slice(2);
  const action = args[0] as EASAction['action'];
  
  if (!action || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const platformIndex = args.findIndex(arg => arg.startsWith('--platform='));
  const platform = platformIndex !== -1 ? args[platformIndex].split('=')[1] as EASAction['platform'] : 'all';
  
  const profileIndex = args.findIndex(arg => arg.startsWith('--profile='));
  const profile = profileIndex !== -1 ? args[profileIndex].split('=')[1] as EASAction['profile'] : 'production';
  
  const local = args.includes('--local');
  const clear = args.includes('--clear-cache');
  
  const messageIndex = args.findIndex(arg => arg.startsWith('--message='));
  const message = messageIndex !== -1 ? args[messageIndex].split('=')[1] : undefined;

  return { action, platform, profile, local, clear, message };
}

function printHelp() {

}

// Check EAS CLI installation
async function checkEASCLI(): Promise<boolean> {
  try {
    execSync('eas --version', { stdio: 'ignore' });
    return true;
  } catch {
    log.error('EAS CLI not installed');
    log.info('Install with: npm install -g eas-cli');
    return false;
  }
}

// Setup EAS for the project
async function setupEAS() {
  log.info('Setting up EAS for Healthcare Alert System...');
  
  // Check if already logged in
  try {
    const whoami = execSync('eas whoami', { encoding: 'utf8' }).trim();
    log.success(`Already logged in as: ${whoami}`);
  } catch {
    log.warn('Not logged in to EAS');
    log.info('Please run: eas login');
    return;
  }
  
  // Verify project configuration
  if (!existsSync('eas.json')) {
    log.error('eas.json not found');
    return;
  }
  
  // Check app.json configuration
  const appConfig = JSON.parse(readFileSync('app.json', 'utf8'));
  const projectId = appConfig.expo?.extra?.eas?.projectId;
  
  if (!projectId) {
    log.warn('EAS project not linked');
    log.info('Running: eas build:configure');
    execSync('eas build:configure', { stdio: 'inherit' });
  } else {
    log.success(`Project ID: ${projectId}`);
  }
  
  // Verify iOS bundle identifier
  const iosBundleId = appConfig.expo?.ios?.bundleIdentifier;
  if (!iosBundleId) {
    log.error('iOS bundle identifier not set');
    log.info('Add to app.json: expo.ios.bundleIdentifier');
  } else {
    log.success(`iOS Bundle ID: ${iosBundleId}`);
  }
  
  // Verify Android package name
  const androidPackage = appConfig.expo?.android?.package;
  if (!androidPackage) {
    log.error('Android package name not set');
    log.info('Add to app.json: expo.android.package');
  } else {
    log.success(`Android Package: ${androidPackage}`);
  }
  
  // Create credentials.json template if needed
  if (!existsSync('credentials.json')) {
    log.info('Creating credentials.json template...');
    const credentialsTemplate = {
      ios: {
        provisioningProfilePath: "path/to/profile.mobileprovision",
        distributionCertificate: {
          path: "path/to/cert.p12",
          password: "CERTIFICATE_PASSWORD"
        }
      },
      android: {
        keystore: {
          path: "path/to/keystore.jks",
          keystorePassword: "KEYSTORE_PASSWORD",
          keyAlias: "KEY_ALIAS",
          keyPassword: "KEY_PASSWORD"
        }
      }
    };
    writeFileSync('credentials.json', JSON.stringify(credentialsTemplate, null, 2));
    log.success('Created credentials.json template');
    log.warn('Update credentials.json with your actual credentials');
  }
  
  log.success('\nEAS setup complete!');
  log.info('\nNext steps:');
  log.info('1. Update credentials.json with your signing credentials');
  log.info('2. Run: bun scripts/deployment/manage-eas.ts build --profile=development');
}

// Start a new build
async function startBuild(platform: string, profile: string, local: boolean, clear: boolean) {
  log.info(`Starting ${profile} build for ${platform}...`);
  
  // Ensure we have a clean working directory
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      log.warn('Working directory has uncommitted changes');
      log.info('Committing changes...');
      execSync('git add -A', { stdio: 'inherit' });
      execSync(`git commit -m "chore: prepare for EAS build (${profile})"`, { stdio: 'inherit' });
    }
  } catch (error) {
    log.error('Failed to commit changes. Please commit manually.');
    return;
  }
  
  // Build command
  let buildCmd = `eas build --platform ${platform} --profile ${profile}`;
  
  if (local) {
    buildCmd += ' --local';
  }
  
  if (clear) {
    buildCmd += ' --clear-cache';
  }
  
  // Add non-interactive flag for CI/CD
  buildCmd += ' --non-interactive';
  
  log.info(`Running: ${buildCmd}`);
  
  try {
    execSync(buildCmd, { stdio: 'inherit' });
    log.success('Build submitted successfully!');
    
    // Show build URL
    log.info('\nView build progress at:');
    log.info('https://expo.dev/accounts/siva9177/projects/hospital-alert-system/builds');
  } catch (error) {
    log.error(`Build failed: ${error.message}`);
  }
}

// List recent builds
async function listBuilds(platform?: string) {
  log.info('Fetching recent builds...');
  
  let listCmd = 'eas build:list --limit 10';
  if (platform && platform !== 'all') {
    listCmd += ` --platform ${platform}`;
  }
  
  try {
    execSync(listCmd, { stdio: 'inherit' });
  } catch (error) {
    log.error(`Failed to list builds: ${error.message}`);
  }
}

// Submit build to app stores
async function submitBuild(platform: string) {
  log.info(`Submitting ${platform} build to app stores...`);
  
  if (platform === 'all') {
    await submitBuild('ios');
    await submitBuild('android');
    return;
  }
  
  try {
    // Get latest build ID
    const buildsJson = execSync(`eas build:list --platform ${platform} --limit 1 --json`, { encoding: 'utf8' });
    const builds = JSON.parse(buildsJson);
    
    if (!builds || builds.length === 0) {
      log.error('No builds found');
      return;
    }
    
    const latestBuild = builds[0];
    
    if (latestBuild.status !== 'finished') {
      log.error(`Latest build is not finished. Status: ${latestBuild.status}`);
      return;
    }
    
    log.info(`Submitting build: ${latestBuild.id}`);
    
    // Submit command
    const submitCmd = `eas submit --platform ${platform} --id ${latestBuild.id} --non-interactive`;
    
    execSync(submitCmd, { stdio: 'inherit' });
    log.success('Build submitted successfully!');
  } catch (error) {
    log.error(`Submit failed: ${error.message}`);
  }
}

// Create and publish OTA update
async function publishUpdate(message?: string) {
  log.info('Publishing OTA update...');
  
  const updateMessage = message || 'Update from Healthcare Alert System';
  
  try {
    // Create update
    const updateCmd = `eas update --branch production --message "${updateMessage}" --non-interactive`;
    
    log.info(`Running: ${updateCmd}`);
    execSync(updateCmd, { stdio: 'inherit' });
    
    log.success('Update published successfully!');
    log.info('\nUsers will receive the update on next app launch');
  } catch (error) {
    log.error(`Update failed: ${error.message}`);
  }
}

// Manage credentials
async function manageCredentials() {

}

// Update app store metadata
async function updateMetadata() {
  log.info('Updating app store metadata...');
  
  // Check for metadata files
  const metadataFiles = {
    'store-config/app-store/metadata.json': 'iOS App Store metadata',
    'store-config/google-play/metadata.json': 'Google Play metadata',
    'assets/screenshots/ios': 'iOS screenshots',
    'assets/screenshots/android': 'Android screenshots',
  };

  for (const [path, description] of Object.entries(metadataFiles)) {
    if (existsSync(path)) {
      log.success(`${description}: Found`);
    } else {
      log.warn(`${description}: Missing`);
    }
  }
  
  // Create metadata template
  if (!existsSync('store-config')) {
    log.info('\nCreating metadata templates...');
    
    // Create directories
    execSync('mkdir -p store-config/app-store store-config/google-play', { stdio: 'inherit' });
    
    // iOS metadata template
    const iosMetadata = {
      name: "Hospital Alert System",
      subtitle: "Real-time healthcare alerts",
      description: "Stay connected with critical patient alerts and healthcare notifications in real-time.",
      keywords: ["healthcare", "alerts", "hospital", "medical", "notifications"],
      supportUrl: "https://healthcare-app.com/support",
      marketingUrl: "https://healthcare-app.com",
      privacyUrl: "https://healthcare-app.com/privacy",
    };
    
    // Android metadata template
    const androidMetadata = {
      title: "Hospital Alert System",
      shortDescription: "Real-time healthcare alerts and notifications",
      fullDescription: "The Hospital Alert System provides healthcare professionals with instant notifications about critical patient alerts, ensuring timely response and improved patient care.",
      video: null,
      contactEmail: "support@healthcare-app.com",
      contactPhone: null,
      contactWebsite: "https://healthcare-app.com",
    };
    
    writeFileSync('store-config/app-store/metadata.json', JSON.stringify(iosMetadata, null, 2));
    writeFileSync('store-config/google-play/metadata.json', JSON.stringify(androidMetadata, null, 2));
    
    log.success('Created metadata templates');
    log.info('Update the metadata files before submission');
  }
}

// Check build status
async function checkBuildStatus() {
  log.info('Checking build status...');
  
  try {
    // Get recent builds
    const buildsJson = execSync('eas build:list --limit 5 --json', { encoding: 'utf8' });
    const builds = JSON.parse(buildsJson);

    for (const build of builds) {
      const statusIcon = build.status === 'finished' ? '✅' : 
                        build.status === 'errored' ? '❌' : 
                        build.status === 'canceled' ? '🚫' : '🔄';
      
      const platform = build.platform === 'ios' ? '🍎 iOS' : '🤖 Android';
      const profile = build.profile.padEnd(12);
      const status = build.status.padEnd(10);
      const createdAt = new Date(build.createdAt).toLocaleString();

      if (build.status === 'finished' && build.artifacts?.buildUrl) {

      }
      
      if (build.status === 'errored') {

      }
    }
    
    // Check update status

    try {
      execSync('eas update:list --limit 5', { stdio: 'inherit' });
    } catch {
      log.info('No updates found');
    }
    
  } catch (error) {
    log.error(`Failed to check status: ${error.message}`);
  }
}

// Main execution
async function main() {
  const { action, platform, profile, local, clear, message } = parseArgs();

  // Check EAS CLI
  if (!await checkEASCLI()) {
    process.exit(1);
  }
  
  try {
    switch (action) {
      case 'setup':
        await setupEAS();
        break;
        
      case 'build':
        await startBuild(platform, profile, local, clear);
        break;
        
      case 'list':
        await listBuilds(platform);
        break;
        
      case 'submit':
        await submitBuild(platform);
        break;
        
      case 'update':
        await publishUpdate(message);
        break;
        
      case 'credentials':
        await manageCredentials();
        break;
        
      case 'metadata':
        await updateMetadata();
        break;
        
      case 'status':
        await checkBuildStatus();
        break;
        
      default:
        log.error(`Unknown action: ${action}`);
        printHelp();
        process.exit(1);
    }
    
    log.success('\nEAS operation completed successfully!');
  } catch (error) {
    log.error(`EAS operation failed: ${error}`);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log.error(`Unexpected error: ${error}`);
  process.exit(1);
});
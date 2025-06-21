#!/usr/bin/env bun

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

// Check function
function checkEnvVariable(envFile: string, variable: string, required: boolean = true): boolean {
  try {
    const content = readFileSync(envFile, 'utf-8');
    const hasVariable = content.includes(`${variable}=`) && !content.includes(`${variable}=your-`);
    
    if (hasVariable) {

      return true;
    } else if (required) {

      return false;
    } else {

      return true;
    }
  } catch (error) {
    if (required) {

    }
    return !required;
  }
}

// Check files
async function checkEnvironment() {
  let allChecksPass = true;
  
  // 1. Check main .env file

  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) {

    allChecksPass = false;
  } else {
    // Required variables for OAuth
    allChecksPass = checkEnvVariable(envPath, 'DATABASE_URL') && allChecksPass;
    allChecksPass = checkEnvVariable(envPath, 'BETTER_AUTH_SECRET') && allChecksPass;
    allChecksPass = checkEnvVariable(envPath, 'BETTER_AUTH_BASE_URL') && allChecksPass;
    allChecksPass = checkEnvVariable(envPath, 'GOOGLE_CLIENT_ID') && allChecksPass;
    allChecksPass = checkEnvVariable(envPath, 'GOOGLE_CLIENT_SECRET') && allChecksPass;
    
    // Optional but recommended
    checkEnvVariable(envPath, 'LOCAL_IP', false);
    checkEnvVariable(envPath, 'EXPO_PUBLIC_API_URL', false);
    checkEnvVariable(envPath, 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', false);
  }
  
  // 2. Check preview environment

  const previewPath = join(process.cwd(), '.env.preview');
  if (!existsSync(previewPath)) {

  } else {
    checkEnvVariable(previewPath, 'EXPO_PUBLIC_API_URL', false);
    checkEnvVariable(previewPath, 'EXPO_PUBLIC_ENVIRONMENT', false);
  }
  
  // 3. Check eas.json

  const easPath = join(process.cwd(), 'eas.json');
  if (!existsSync(easPath)) {

    allChecksPass = false;
  } else {
    const easConfig = JSON.parse(readFileSync(easPath, 'utf-8'));
    
    // Check preview build config
    if (easConfig.build?.preview) {

      // Check API URL
      const apiUrl = easConfig.build.preview.env?.EXPO_PUBLIC_API_URL;
      if (apiUrl && apiUrl !== 'http://localhost:8081') {

      }
    } else {

      allChecksPass = false;
    }
  }
  
  // 4. Check app.json

  const appPath = join(process.cwd(), 'app.json');
  if (!existsSync(appPath)) {

    allChecksPass = false;
  } else {
    const appConfig = JSON.parse(readFileSync(appPath, 'utf-8'));
    
    // Check OAuth scheme
    const scheme = appConfig.expo?.scheme;
    if (scheme) {

    } else {

      allChecksPass = false;
    }
    
    // Check bundle identifiers
    const iosBundleId = appConfig.expo?.ios?.bundleIdentifier;
    const androidPackage = appConfig.expo?.android?.package;
    
    if (iosBundleId) {

    } else {

      allChecksPass = false;
    }
    
    if (androidPackage) {

    } else {

      allChecksPass = false;
    }
    
    // Check EAS project ID
    const projectId = appConfig.expo?.extra?.eas?.projectId;
    if (projectId) {

    } else {

      allChecksPass = false;
    }
  }
  
  // 5. OAuth-specific checks

  // Check if Google credentials are properly set
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    
    // Check for web client ID consistency
    const googleClientIdMatch = envContent.match(/GOOGLE_CLIENT_ID=(.+)/);
    const expoPublicGoogleMatch = envContent.match(/EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=(.+)/);
    
    if (googleClientIdMatch && expoPublicGoogleMatch) {
      if (googleClientIdMatch[1] === expoPublicGoogleMatch[1]) {

      } else {

      }
    }
    
    // Check for localhost in Better Auth URL
    const betterAuthUrlMatch = envContent.match(/BETTER_AUTH_BASE_URL=(.+)/);
    if (betterAuthUrlMatch && betterAuthUrlMatch[1].includes('localhost')) {

    } else if (betterAuthUrlMatch && betterAuthUrlMatch[1].includes('192.168')) {

    }
  }
  
  // Summary

  if (allChecksPass) {

  } else {

  }
  
  // Additional warnings

  process.exit(allChecksPass ? 0 : 1);
}

// Run the check
checkEnvironment().catch(console.error);
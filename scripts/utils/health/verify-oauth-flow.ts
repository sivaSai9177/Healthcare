#!/usr/bin/env bun

/**
 * Verify OAuth flow configuration
 * This script checks all components of the OAuth redirect flow
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

async function verifyOAuthFlow() {

  const checks: { name: string; status: boolean; details: string }[] = [];
  
  // 1. Check auth-server.ts configuration

  try {
    const authServerPath = path.join(process.cwd(), 'lib/auth/auth-server.ts');
    const authServerContent = fs.readFileSync(authServerPath, 'utf-8');
    
    const hasGuestDefault = authServerContent.includes('defaultValue: "guest"');
    const hasNeedsProfileCompletionDefault = authServerContent.includes('defaultValue: true');
    const hasSignInCallback = authServerContent.includes('signIn.before callback');
    
    checks.push({
      name: 'Auth server guest role default',
      status: hasGuestDefault,
      details: hasGuestDefault ? 'defaultValue: "guest"' : 'Missing guest default'
    });
    
    checks.push({
      name: 'Auth server needsProfileCompletion default',
      status: hasNeedsProfileCompletionDefault,
      details: hasNeedsProfileCompletionDefault ? 'defaultValue: true' : 'Missing needsProfileCompletion default'
    });
    
    checks.push({
      name: 'Auth server OAuth callbacks',
      status: hasSignInCallback,
      details: hasSignInCallback ? 'signIn callbacks configured' : 'Missing OAuth callbacks'
    });
  } catch (error: any) {
    checks.push({
      name: 'Auth server configuration',
      status: false,
      details: `Error: ${error.message}`
    });
  }
  
  // 2. Check auth-callback.tsx

  try {
    const authCallbackPath = path.join(process.cwd(), 'app/auth-callback.tsx');
    const authCallbackContent = fs.readFileSync(authCallbackPath, 'utf-8');
    
    const hasOAuthDelay = authCallbackContent.includes('1500'); // 1.5 second delay
    const hasDebugLogs = authCallbackContent.includes('[AUTH_CALLBACK] OAuth Callback Debug:');
    const hasProfileRedirect = authCallbackContent.includes('/(auth)/complete-profile');
    
    checks.push({
      name: 'Auth callback OAuth delay',
      status: hasOAuthDelay,
      details: hasOAuthDelay ? '1.5 second delay configured' : 'Missing OAuth delay'
    });
    
    checks.push({
      name: 'Auth callback debug logs',
      status: hasDebugLogs,
      details: hasDebugLogs ? 'Debug logging enabled' : 'Missing debug logs'
    });
    
    checks.push({
      name: 'Auth callback profile redirect',
      status: hasProfileRedirect,
      details: hasProfileRedirect ? 'Redirects to complete-profile' : 'Missing profile redirect'
    });
  } catch (error: any) {
    checks.push({
      name: 'Auth callback configuration',
      status: false,
      details: `Error: ${error.message}`
    });
  }
  
  // 3. Check auth router

  try {
    const authRouterPath = path.join(process.cwd(), 'src/server/routers/auth.ts');
    const authRouterContent = fs.readFileSync(authRouterPath, 'utf-8');
    
    const hasGetSessionDebug = authRouterContent.includes('[AUTH_ROUTER] getSession called');
    const hasIncompleteProfileCheck = authRouterContent.includes('isIncompleteProfile');
    
    checks.push({
      name: 'Auth router getSession debug',
      status: hasGetSessionDebug,
      details: hasGetSessionDebug ? 'Debug logging in getSession' : 'Missing debug logs'
    });
    
    checks.push({
      name: 'Auth router incomplete profile check',
      status: hasIncompleteProfileCheck,
      details: hasIncompleteProfileCheck ? 'Checks for incomplete profiles' : 'Missing profile check'
    });
  } catch (error: any) {
    checks.push({
      name: 'Auth router configuration',
      status: false,
      details: `Error: ${error.message}`
    });
  }
  
  // 4. Check toAppUser function

  try {
    const authStorePath = path.join(process.cwd(), 'lib/stores/auth-store.ts');
    const authStoreContent = fs.readFileSync(authStorePath, 'utf-8');
    
    const hasToAppUserDebug = authStoreContent.includes('[AUTH_STORE] toAppUser conversion');
    const hasGuestRoleCheck = authStoreContent.includes("user.role === 'guest'");
    
    checks.push({
      name: 'Auth store toAppUser debug',
      status: hasToAppUserDebug,
      details: hasToAppUserDebug ? 'Debug logging in toAppUser' : 'Missing debug logs'
    });
    
    checks.push({
      name: 'Auth store guest role handling',
      status: hasGuestRoleCheck,
      details: hasGuestRoleCheck ? 'Handles guest role correctly' : 'Missing guest role check'
    });
  } catch (error: any) {
    checks.push({
      name: 'Auth store configuration',
      status: false,
      details: `Error: ${error.message}`
    });
  }
  
  // Display results

  let allPassed = true;
  for (const check of checks) {
    const icon = check.status ? chalk.green('✓') : chalk.red('✗');
    const name = check.status ? chalk.green(check.name) : chalk.red(check.name);

    if (!check.status) allPassed = false;
  }
  
  // Summary

  if (allPassed) {

  } else {

  }
}

// Run verification
verifyOAuthFlow()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('❌ Verification failed:'), error);
    process.exit(1);
  });
#!/usr/bin/env bun

/**
 * Test OAuth Flow Configuration
 * This script tests the OAuth configuration and helps diagnose issues
 */

import chalk from 'chalk';

async function testOAuthFlow() {
  console.log(chalk.blue('🔍 Testing OAuth Flow Configuration\n'));

  // 1. Check environment variables
  console.log(chalk.yellow('1. Checking environment variables...'));
  
  const requiredEnvVars = {
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
    'BETTER_AUTH_BASE_URL': process.env.BETTER_AUTH_BASE_URL,
    'BETTER_AUTH_SECRET': process.env.BETTER_AUTH_SECRET,
  };
  
  let allEnvVarsSet = true;
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (value) {
      console.log(chalk.green(`✓ ${key} is set`));
      if (key.includes('SECRET')) {
        console.log(`  Value: ${value.substring(0, 10)}...`);
      } else {
        console.log(`  Value: ${value}`);
      }
    } else {
      console.log(chalk.red(`✗ ${key} is NOT set`));
      allEnvVarsSet = false;
    }
  }
  
  if (!allEnvVarsSet) {
    console.log(chalk.red('\n❌ Some required environment variables are missing!'));
    return;
  }
  
  // 2. Test Better Auth endpoint
  console.log(chalk.yellow('\n2. Testing Better Auth endpoint...'));
  
  try {
    const healthResponse = await fetch('http://localhost:8081/api/auth/health');
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      console.log(chalk.green('✓ Better Auth is running'));
      console.log(`  Response: ${JSON.stringify(data)}`);
    } else {
      console.log(chalk.red('✗ Better Auth health check failed'));
      console.log(`  Status: ${healthResponse.status}`);
    }
  } catch (error: any) {
    console.log(chalk.red('✗ Cannot reach Better Auth'));
    console.log(`  Error: ${error.message}`);
  }
  
  // 3. Check OAuth redirect URLs
  console.log(chalk.yellow('\n3. OAuth redirect URLs configuration...'));
  
  const baseUrl = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:8081/api/auth';
  const expectedRedirectUrls = [
    `${baseUrl}/callback/google`,
    `http://localhost:8081/auth-callback`,
    `http://localhost:8081/api/auth/callback/google`,
  ];
  
  console.log('Expected Google OAuth redirect URIs:');
  expectedRedirectUrls.forEach(url => {
    console.log(`  - ${chalk.cyan(url)}`);
  });
  
  // 4. Test OAuth initiation
  console.log(chalk.yellow('\n4. Testing OAuth initiation...'));
  
  try {
    const oauthResponse = await fetch('http://localhost:8081/api/auth/sign-in/social', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'google',
        callbackURL: 'http://localhost:8081/auth-callback'
      })
    });
    
    if (oauthResponse.ok) {
      const data = await oauthResponse.json();
      console.log(chalk.green('✓ OAuth initiation endpoint works'));
      if (data.url) {
        console.log(`  Redirect URL: ${chalk.cyan(data.url.substring(0, 50))}...`);
        
        // Parse the Google OAuth URL
        const googleUrl = new URL(data.url);
        const redirectUri = googleUrl.searchParams.get('redirect_uri');
        console.log(`  Google redirect_uri: ${chalk.cyan(redirectUri)}`);
      }
    } else {
      console.log(chalk.red('✗ OAuth initiation failed'));
      console.log(`  Status: ${oauthResponse.status}`);
      const errorText = await oauthResponse.text();
      console.log(`  Error: ${errorText}`);
    }
  } catch (error: any) {
    console.log(chalk.red('✗ Cannot initiate OAuth'));
    console.log(`  Error: ${error.message}`);
  }
  
  // 5. Provide debugging instructions
  console.log(chalk.blue('\n📋 Debugging Instructions:'));
  console.log('\n1. Check Google Cloud Console:');
  console.log('   https://console.cloud.google.com/apis/credentials');
  console.log('   - Select your OAuth 2.0 Client ID');
  console.log('   - Add these redirect URIs:');
  expectedRedirectUrls.forEach(url => {
    console.log(`     ${chalk.cyan(url)}`);
  });
  
  console.log('\n2. In browser console:');
  console.log('   window.debugger.enableModule("Auth")');
  console.log('   // Then try OAuth flow');
  console.log('   window.debugger.getModuleLogs("Auth")');
  
  console.log('\n3. Check Network tab for:');
  console.log('   - /api/auth/sign-in/social');
  console.log('   - accounts.google.com');
  console.log('   - /api/auth/callback/google');
  console.log('   - /auth-callback');
  
  console.log('\n4. After OAuth, check cookies:');
  console.log('   document.cookie');
  console.log('   // Look for better-auth.session_token');
}

// Run the test
testOAuthFlow()
  .then(() => {
    console.log(chalk.green('\n✅ OAuth configuration test complete!'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('❌ Test failed:'), error);
    process.exit(1);
  });
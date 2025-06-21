#!/usr/bin/env bun

/**
 * Test OAuth Flow Configuration
 * This script tests the OAuth configuration and helps diagnose issues
 */

import chalk from 'chalk';

async function testOAuthFlow() {

  // 1. Check environment variables

  const requiredEnvVars = {
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
    'BETTER_AUTH_BASE_URL': process.env.BETTER_AUTH_BASE_URL,
    'BETTER_AUTH_SECRET': process.env.BETTER_AUTH_SECRET,
  };
  
  let allEnvVarsSet = true;
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (value) {

      if (key.includes('SECRET')) {

      } else {

      }
    } else {

      allEnvVarsSet = false;
    }
  }
  
  if (!allEnvVarsSet) {

    return;
  }
  
  // 2. Test Better Auth endpoint

  try {
    const healthResponse = await fetch('http://localhost:8081/api/auth/health');
    if (healthResponse.ok) {
      const data = await healthResponse.json();

    } else {

    }
  } catch (error: any) {

  }
  
  // 3. Check OAuth redirect URLs

  const baseUrl = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:8081/api/auth';
  const expectedRedirectUrls = [
    `${baseUrl}/callback/google`,
    `http://localhost:8081/auth-callback`,
    `http://localhost:8081/api/auth/callback/google`,
  ];

  expectedRedirectUrls.forEach(url => {

  });
  
  // 4. Test OAuth initiation

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

      if (data.url) {

        // Parse the Google OAuth URL
        const googleUrl = new URL(data.url);
        const redirectUri = googleUrl.searchParams.get('redirect_uri');

      }
    } else {

      const errorText = await oauthResponse.text();

    }
  } catch (error: any) {

  }
  
  // 5. Provide debugging instructions

  expectedRedirectUrls.forEach(url => {

  });

}

// Run the test
testOAuthFlow()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('❌ Test failed:'), error);
    process.exit(1);
  });
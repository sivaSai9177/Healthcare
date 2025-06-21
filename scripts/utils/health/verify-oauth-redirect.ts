#!/usr/bin/env bun

/**
 * Verify OAuth Redirect Configuration
 * This script verifies that the OAuth redirect is properly configured
 */

import chalk from 'chalk';

async function verifyOAuthRedirect() {

  try {
    // 1. Initiate OAuth flow
    const response = await fetch('http://localhost:8081/api/auth/sign-in/social', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (test)', // Ensure it's detected as web
      },
      body: JSON.stringify({
        provider: 'google',
        callbackURL: 'http://localhost:8081/auth-callback'
      })
    });
    
    if (!response.ok) {

      const error = await response.text();

      return;
    }
    
    const data = await response.json();

    if (data.url) {
      const googleUrl = new URL(data.url);
      const redirectUri = googleUrl.searchParams.get('redirect_uri');
      const state = googleUrl.searchParams.get('state');

      // 2. Expected flow

      // 3. Debugging checklist

    } else {

    }
    
  } catch (error: any) {

  }
}

// Run verification
verifyOAuthRedirect()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('❌ Verification failed:'), error);
    process.exit(1);
  });
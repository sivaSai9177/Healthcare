#!/usr/bin/env bun

/**
 * Verify OAuth Redirect Configuration
 * This script verifies that the OAuth redirect is properly configured
 */

import chalk from 'chalk';

async function verifyOAuthRedirect() {
  console.log(chalk.blue('🔍 Verifying OAuth Redirect Configuration\n'));

  console.log(chalk.yellow('Testing OAuth initiation and checking redirect configuration...'));
  
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
      console.log(chalk.red('✗ OAuth initiation failed'));
      console.log(`  Status: ${response.status}`);
      const error = await response.text();
      console.log(`  Error: ${error}`);
      return;
    }
    
    const data = await response.json();
    console.log(chalk.green('✓ OAuth initiation successful'));
    
    if (data.url) {
      const googleUrl = new URL(data.url);
      const redirectUri = googleUrl.searchParams.get('redirect_uri');
      const state = googleUrl.searchParams.get('state');
      
      console.log(chalk.cyan('\nOAuth Flow Details:'));
      console.log(`  Google OAuth URL: ${data.url.substring(0, 60)}...`);
      console.log(`  Redirect URI: ${chalk.yellow(redirectUri)}`);
      console.log(`  State: ${state}`);
      
      // 2. Expected flow
      console.log(chalk.blue('\n📋 Expected OAuth Flow:'));
      console.log('1. User clicks "Continue with Google"');
      console.log('2. Redirected to Google OAuth consent screen');
      console.log(`3. Google redirects to: ${chalk.yellow(redirectUri)}`);
      console.log('4. Better Auth processes the OAuth callback');
      console.log('5. Better Auth creates session and user');
      console.log('6. Better Auth redirects to: ' + chalk.yellow('/auth-callback'));
      console.log('7. /auth-callback checks session and redirects to appropriate page');
      
      // 3. Debugging checklist
      console.log(chalk.blue('\n🐛 Debugging Checklist:'));
      console.log('\n✓ Check Google Console redirect URIs include:');
      console.log(`  - ${chalk.cyan(redirectUri)}`);
      console.log('\n✓ Enable debug logging in browser:');
      console.log('  window.debugger.enableModule("Auth")');
      console.log('\n✓ Monitor server logs for:');
      console.log('  - [AUTH_SERVER] signIn.before callback triggered');
      console.log('  - [AUTH_SERVER] signIn.after callback triggered');
      console.log('  - [AUTH_SERVER] Web OAuth successful, redirecting to auth-callback');
      console.log('\n✓ Check browser Network tab for:');
      console.log('  - POST /api/auth/sign-in/social');
      console.log('  - GET ' + redirectUri);
      console.log('  - GET /auth-callback');
      console.log('\n✓ After OAuth, check cookies:');
      console.log('  document.cookie // Should contain better-auth.session_token');
      
    } else {
      console.log(chalk.red('✗ No redirect URL received'));
      console.log('Response:', data);
    }
    
  } catch (error: any) {
    console.log(chalk.red('✗ Test failed'));
    console.log(`  Error: ${error.message}`);
  }
}

// Run verification
verifyOAuthRedirect()
  .then(() => {
    console.log(chalk.green('\n✅ Verification complete!'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('❌ Verification failed:'), error);
    process.exit(1);
  });
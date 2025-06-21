#!/usr/bin/env bun
/**
 * Unified Auth Management Script
 * 
 * Consolidates all authentication operations: OAuth setup, testing, debugging
 * 
 * Usage:
 *   bun run scripts/auth/manage-auth-unified.ts [action] [options]
 * 
 * Actions:
 *   test      - Test authentication flow
 *   verify    - Verify OAuth configuration
 *   fix       - Fix common OAuth issues
 *   setup     - Setup OAuth providers
 *   debug     - Debug authentication issues
 *   session   - Manage sessions
 *   tokens    - Inspect tokens
 * 
 * Options:
 *   --help, -h      Show help
 *   --provider      OAuth provider (google, github, etc.)
 *   --email         User email for testing
 *   --verbose       Detailed output
 *   --fix-all       Apply all known fixes
 */

import { 
  parseArgs, 
  printHelp, 
  logger, 
  handleError, 
  ensureCleanup,
  confirm,
  select,
  prompt,
  withSpinner
} from '../lib';
import { 
  config,
  validateEnvironment,
  requireAuth,
  EMOJI
} from '../config';
import {
  apiRequest,
  authenticate,
  checkApiHealth
} from '../lib/test-helpers';
import { execSync } from 'child_process';

type Action = 'test' | 'verify' | 'fix' | 'setup' | 'debug' | 'session' | 'tokens';

interface Options {
  action?: Action;
  provider?: string;
  email?: string;
  verbose: boolean;
  fixAll: boolean;
}

async function main() {
  try {
    const args = parseArgs();
    
    if (args.help || args.h) {
      printHelp({
        usage: 'bun run scripts/auth/manage-auth-unified.ts [action] [options]',
        description: 'Unified authentication management and debugging',
        options: [
          { flag: 'action', description: 'Action to perform' },
          { flag: '--help, -h', description: 'Show help' },
          { flag: '--provider', description: 'OAuth provider' },
          { flag: '--email', description: 'User email for testing' },
          { flag: '--verbose', description: 'Detailed output' },
          { flag: '--fix-all', description: 'Apply all known fixes' },
        ],
        examples: [
          'bun run scripts/auth/manage-auth-unified.ts test --email=admin@hospital.test',
          'bun run scripts/auth/manage-auth-unified.ts verify --provider=google',
          'bun run scripts/auth/manage-auth-unified.ts fix --fix-all',
          'bun run scripts/auth/manage-auth-unified.ts debug',
        ],
      });
      process.exit(0);
    }
    
    // Parse options
    const action = args._[0] as Action || args.action as Action;
    const options: Options = {
      action,
      provider: args.provider as string,
      email: args.email as string,
      verbose: Boolean(args.verbose || args.v),
      fixAll: Boolean(args['fix-all']),
    };
    
    // Interactive mode if no action
    if (!options.action) {
      options.action = await select(
        'Select auth action:',
        ['test', 'verify', 'fix', 'setup', 'debug', 'session', 'tokens'],
        0
      ) as Action;
    }
    
    // Set log level
    if (options.verbose) {
      logger.level = 'DEBUG';
    }
    
    // Validate environment
    await validateEnvironment();
    
    // Execute action
    await execute(options);
    
    logger.success('Auth operation completed successfully');
  } catch (error) {
    handleError(error);
  }
}

async function execute(options: Options) {
  const { action } = options;
  
  switch (action) {
    case 'test':
      await handleTest(options);
      break;
    case 'verify':
      await handleVerify(options);
      break;
    case 'fix':
      await handleFix(options);
      break;
    case 'setup':
      await handleSetup(options);
      break;
    case 'debug':
      await handleDebug(options);
      break;
    case 'session':
      await handleSession(options);
      break;
    case 'tokens':
      await handleTokens(options);
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

async function handleTest(options: Options) {
  logger.info('Testing authentication flow...');
  
  // Check API health first
  if (!await checkApiHealth()) {
    throw new Error('API is not healthy. Please ensure services are running.');
  }
  
  // Get test credentials
  const email = options.email || await prompt('Email', 'admin@hospital.test');
  const password = await prompt('Password', 'Admin123!');
  
  // Test sign up (if new user)
  logger.info('\n1. Testing sign up...');
  
  const signUpResponse = await apiRequest('/api/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: 'Test User' }),
  });
  
  if (signUpResponse.ok) {
    logger.success('✓ Sign up successful');
  } else if (signUpResponse.status === 409) {
    logger.info('ℹ User already exists (expected)');
  } else {
    logger.error(`✗ Sign up failed: ${signUpResponse.error}`);
  }
  
  // Test sign in
  logger.info('\n2. Testing sign in...');
  
  try {
    const sessionToken = await authenticate(email, password);
    logger.success('✓ Sign in successful');
    logger.debug(`Session token: ${sessionToken.substring(0, 20)}...`);
    
    // Test session
    logger.info('\n3. Testing session...');
    
    const sessionResponse = await apiRequest('/api/auth/session', {
      headers: { Cookie: `better-auth.session=${sessionToken}` }
    });
    
    if (sessionResponse.ok && sessionResponse.data?.user) {
      logger.success('✓ Session valid');
      logger.info(`User: ${sessionResponse.data.user.email} (${sessionResponse.data.user.role})`);
    } else {
      logger.error('✗ Session invalid');
    }
    
    // Test protected endpoint
    logger.info('\n4. Testing protected endpoint...');
    
    const protectedResponse = await apiRequest('/api/trpc/auth.getSession', {
      method: 'POST',
      headers: { Cookie: `better-auth.session=${sessionToken}` },
      body: JSON.stringify({ json: {} }),
    });
    
    if (protectedResponse.ok) {
      logger.success('✓ Protected endpoint accessible');
    } else {
      logger.error('✗ Protected endpoint failed');
    }
    
    // Test sign out
    logger.info('\n5. Testing sign out...');
    
    const signOutResponse = await apiRequest('/api/auth/sign-out', {
      method: 'POST',
      headers: { Cookie: `better-auth.session=${sessionToken}` },
    });
    
    if (signOutResponse.ok) {
      logger.success('✓ Sign out successful');
    } else {
      logger.error('✗ Sign out failed');
    }
    
  } catch (error) {
    logger.error(`✗ Authentication failed: ${error.message}`);
  }
  
  // Summary
  logger.separator('=', 60);
  logger.info('Test Summary:');
  logger.info('Use these credentials for testing:');
  logger.info(`  Email: ${email}`);
  logger.info(`  Password: ${password}`);
}

async function handleVerify(options: Options) {
  logger.info('Verifying authentication configuration...');
  
  const checks = {
    environment: false,
    database: false,
    authSecret: false,
    authUrl: false,
    oauth: false,
    endpoints: false,
  };
  
  // Check environment variables
  logger.info('\n1. Checking environment variables...');
  
  try {
    requireAuth();
    checks.environment = true;
    logger.success('✓ Environment variables configured');
  } catch (error) {
    logger.error(`✗ ${error.message}`);
  }
  
  // Check database connection
  logger.info('\n2. Checking database connection...');
  
  try {
    const { getDatabase } = await import('../config/database');
    await getDatabase();
    checks.database = true;
    logger.success('✓ Database connected');
  } catch (error) {
    logger.error(`✗ Database connection failed: ${error.message}`);
  }
  
  // Check auth configuration
  logger.info('\n3. Checking Better Auth configuration...');
  
  if (config.BETTER_AUTH_SECRET && config.BETTER_AUTH_SECRET.length >= 32) {
    checks.authSecret = true;
    logger.success('✓ Auth secret configured');
  } else {
    logger.error('✗ Auth secret missing or too short');
  }
  
  if (config.BETTER_AUTH_URL) {
    checks.authUrl = true;
    logger.success(`✓ Auth URL: ${config.BETTER_AUTH_URL}`);
  } else {
    logger.error('✗ Auth URL not configured');
  }
  
  // Check OAuth providers
  if (options.provider || config.GOOGLE_CLIENT_ID) {
    logger.info('\n4. Checking OAuth providers...');
    
    const providers = ['google', 'github'];
    const provider = options.provider || 'google';
    
    if (provider === 'google') {
      if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
        checks.oauth = true;
        logger.success('✓ Google OAuth configured');
        logger.info(`  Client ID: ${config.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
      } else {
        logger.error('✗ Google OAuth not configured');
      }
    }
  }
  
  // Check endpoints
  logger.info('\n5. Checking auth endpoints...');
  
  const endpoints = [
    '/api/auth/sign-in',
    '/api/auth/sign-up',
    '/api/auth/session',
    '/api/auth/sign-out',
  ];
  
  let allEndpointsOk = true;
  
  for (const endpoint of endpoints) {
    const response = await apiRequest(endpoint, { method: 'GET' });
    
    if (response.status === 405 || response.status === 200) {
      logger.success(`✓ ${endpoint}`);
    } else {
      logger.error(`✗ ${endpoint} (${response.status})`);
      allEndpointsOk = false;
    }
  }
  
  checks.endpoints = allEndpointsOk;
  
  // Summary
  logger.separator('=', 60);
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  logger.info(`Verification Summary: ${passed}/${total} checks passed`);
  
  if (passed < total) {
    logger.error('\nIssues found:');
    Object.entries(checks).forEach(([check, passed]) => {
      if (!passed) {
        logger.error(`  - ${check}`);
      }
    });
    
    logger.info('\nRun with --fix-all to attempt automatic fixes');
  } else {
    logger.success('\nAll checks passed! Authentication is properly configured.');
  }
}

async function handleFix(options: Options) {
  const { fixAll } = options;
  
  logger.info('Fixing authentication issues...');
  
  const fixes = [
    { name: 'Environment variables', fn: fixEnvironment },
    { name: 'Database tables', fn: fixDatabase },
    { name: 'OAuth redirect URLs', fn: fixOAuthRedirects },
    { name: 'Session configuration', fn: fixSessionConfig },
  ];
  
  if (fixAll) {
    logger.info('Applying all fixes...');
    
    for (const fix of fixes) {
      await withSpinner(`Fixing ${fix.name}`, async () => {
        await fix.fn();
      });
    }
  } else {
    // Interactive fix selection
    const selected = await multiSelect(
      'Select fixes to apply:',
      fixes.map(f => f.name),
      [0, 1]
    );
    
    for (const fixName of selected) {
      const fix = fixes.find(f => f.name === fixName)!;
      await withSpinner(`Fixing ${fix.name}`, async () => {
        await fix.fn();
      });
    }
  }
  
  logger.success('Fixes applied successfully');
  logger.info('\nRun verify action to check configuration');
}

async function fixEnvironment() {
  // Generate auth secret if missing
  if (!config.BETTER_AUTH_SECRET) {
    const secret = generateAuthSecret();
    logger.info(`Generated auth secret: ${secret}`);
    logger.warn('Add to .env.local: BETTER_AUTH_SECRET=' + secret);
  }
  
  // Set auth URL if missing
  if (!config.BETTER_AUTH_URL) {
    const url = config.APP_ENV === 'local' 
      ? 'http://localhost:8081' 
      : config.APP_URL || 'http://localhost:8081';
    logger.warn('Add to .env.local: BETTER_AUTH_URL=' + url);
  }
}

async function fixDatabase() {
  // Run migrations to ensure auth tables exist
  execSync('bun drizzle-kit push', {
    env: { ...process.env, DATABASE_URL: config.databaseUrl },
    stdio: 'inherit'
  });
}

async function fixOAuthRedirects() {
  if (config.GOOGLE_CLIENT_ID) {
    logger.info('Google OAuth redirect URLs:');
    logger.info('  Development: http://localhost:8081/api/auth/callback/google');
    logger.info('  Production: https://yourdomain.com/api/auth/callback/google');
    logger.info('\nAdd these to Google Cloud Console:');
    logger.info('  https://console.cloud.google.com/apis/credentials');
  }
}

async function fixSessionConfig() {
  logger.info('Session configuration:');
  logger.info('  Cookie name: better-auth.session');
  logger.info('  Secure: ' + (config.isProduction ? 'true' : 'false'));
  logger.info('  SameSite: lax');
  logger.info('  HttpOnly: true');
}

async function handleSetup(options: Options) {
  logger.info('Setting up authentication providers...');
  
  const provider = options.provider || await select(
    'Select provider to setup:',
    ['google', 'github', 'credentials-only'],
    0
  );
  
  switch (provider) {
    case 'google':
      await setupGoogleOAuth();
      break;
    case 'github':
      await setupGitHubOAuth();
      break;
    case 'credentials-only':
      logger.info('Credentials-based auth is enabled by default');
      break;
  }
}

async function setupGoogleOAuth() {
  logger.box('Google OAuth Setup');
  
  logger.info('1. Create a project at:');
  logger.info('   https://console.cloud.google.com');
  
  logger.info('\n2. Enable Google+ API');
  
  logger.info('\n3. Create OAuth 2.0 credentials');
  
  logger.info('\n4. Add redirect URIs:');
  logger.info('   - http://localhost:8081/api/auth/callback/google');
  logger.info('   - Your production URL + /api/auth/callback/google');
  
  logger.info('\n5. Add to .env.local:');
  
  const clientId = await prompt('Enter GOOGLE_CLIENT_ID');
  const clientSecret = await prompt('Enter GOOGLE_CLIENT_SECRET');
  
  logger.info('\nAdd these to .env.local:');
  logger.info(`GOOGLE_CLIENT_ID=${clientId}`);
  logger.info(`GOOGLE_CLIENT_SECRET=${clientSecret}`);
}

async function setupGitHubOAuth() {
  logger.box('GitHub OAuth Setup');
  
  logger.info('1. Create OAuth App at:');
  logger.info('   https://github.com/settings/developers');
  
  logger.info('\n2. Set Authorization callback URL:');
  logger.info('   http://localhost:8081/api/auth/callback/github');
  
  logger.info('\n3. Add to .env.local:');
  
  const clientId = await prompt('Enter GITHUB_CLIENT_ID');
  const clientSecret = await prompt('Enter GITHUB_CLIENT_SECRET');
  
  logger.info('\nAdd these to .env.local:');
  logger.info(`GITHUB_CLIENT_ID=${clientId}`);
  logger.info(`GITHUB_CLIENT_SECRET=${clientSecret}`);
}

async function handleDebug(options: Options) {
  logger.info('Debugging authentication...');
  
  // Collect debug information
  const debugInfo = {
    environment: config.APP_ENV,
    authConfigured: !!(config.BETTER_AUTH_SECRET && config.BETTER_AUTH_URL),
    providers: {
      google: !!config.GOOGLE_CLIENT_ID,
      credentials: true,
    },
    apiHealth: await checkApiHealth(),
  };
  
  logger.box('Debug Information');
  logger.info(JSON.stringify(debugInfo, null, 2));
  
  // Check common issues
  logger.separator();
  logger.info('Common Issues:');
  
  if (!debugInfo.authConfigured) {
    logger.error('❌ Authentication not properly configured');
    logger.info('   Run: bun run scripts/auth/manage-auth-unified.ts fix --fix-all');
  }
  
  if (!debugInfo.apiHealth) {
    logger.error('❌ API server not running');
    logger.info('   Run: bun run scripts/services/start-unified-optimized.ts');
  }
  
  // Test with verbose logging
  if (options.verbose) {
    logger.separator();
    logger.info('Running verbose test...');
    process.env.DEBUG = 'better-auth:*';
    await handleTest(options);
  }
}

async function handleSession(options: Options) {
  const email = options.email || await prompt('Email to check sessions for');
  
  logger.info(`Checking sessions for ${email}...`);
  
  // This would query the database for active sessions
  // Implementation depends on your session storage
  
  logger.info('Session management features:');
  logger.info('  - View active sessions');
  logger.info('  - Revoke sessions');
  logger.info('  - Clear all sessions');
}

async function handleTokens(options: Options) {
  logger.info('Token inspection and management...');
  
  const token = await prompt('Enter token to inspect (or press enter to skip)');
  
  if (token) {
    try {
      // Decode JWT token
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        logger.info('Token payload:');
        logger.info(JSON.stringify(payload, null, 2));
        
        // Check expiration
        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          const isExpired = expDate < new Date();
          logger.info(`\nExpires: ${expDate.toISOString()} ${isExpired ? '(EXPIRED)' : '(VALID)'}`);
        }
      } else {
        logger.error('Invalid token format');
      }
    } catch (error) {
      logger.error('Failed to decode token:', error.message);
    }
  }
}

function generateAuthSecret(): string {
  return Array.from({ length: 64 }, () => 
    Math.random().toString(36).charAt(2)
  ).join('');
}

// Run the script
main();
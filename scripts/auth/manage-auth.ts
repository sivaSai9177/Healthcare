#!/usr/bin/env bun
/**
 * Authentication Management Script
 * Handles auth testing, OAuth setup, session management, and debugging
 */

import { db } from '../../src/db/server-db';
import { session, user as userTable, account } from '../../src/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import chalk from 'chalk';
import fetch from 'node-fetch';

// Simple logger
const log = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.log(msg),
  warn: (msg: string) => console.log(msg),
  debug: (msg: string) => process.env.DEBUG && console.log(msg),
};

interface AuthAction {
  action: 'test' | 'sessions' | 'verify' | 'fix' | 'debug' | 'clean' | 'oauth-status';
  email?: string;
  provider?: string;
  force?: boolean;
}

// Parse command line arguments
function parseArgs(): AuthAction {
  const args = process.argv.slice(2);
  const action = args[0] as AuthAction['action'];
  
  if (!action || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const emailIndex = args.findIndex(arg => arg.startsWith('--email='));
  const email = emailIndex !== -1 ? args[emailIndex].split('=')[1] : undefined;
  
  const providerIndex = args.findIndex(arg => arg.startsWith('--provider='));
  const provider = providerIndex !== -1 ? args[providerIndex].split('=')[1] : undefined;
  
  const force = args.includes('--force') || args.includes('-f');

  return { action, email, provider, force };
}

function printHelp() {

}

// Test authentication flow
async function testAuthFlow(email?: string) {
  const testEmail = email || 'operator@hospital.com';
  const testPassword = 'password123';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
  
  log.info(`Testing authentication with ${testEmail}...`);
  
  try {
    // Test login
    log.info('Testing login endpoint...');
    const loginResponse = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    
    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      log.error(`Login failed: ${error}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    log.success('Login successful!');
    log.debug(`Session token: ${loginData.session?.token?.substring(0, 20)}...`);
    
    // Test session validation
    if (loginData.session?.token) {
      log.info('Testing session validation...');
      const sessionResponse = await fetch(`${apiUrl}/api/auth/get-session`, {
        headers: { 
          'Authorization': `Bearer ${loginData.session.token}`,
        },
      });
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        log.success('Session is valid!');
        log.debug(`User: ${sessionData.user?.email}, Role: ${sessionData.user?.role}`);
      } else {
        log.error('Session validation failed');
      }
    }
    
    // Test logout
    if (loginData.session?.token) {
      log.info('Testing logout...');
      const logoutResponse = await fetch(`${apiUrl}/api/auth/sign-out`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${loginData.session.token}`,
        },
      });
      
      if (logoutResponse.ok) {
        log.success('Logout successful!');
      } else {
        log.error('Logout failed');
      }
    }
    
  } catch (error) {
    log.error(`Authentication test failed: ${error}`);
  }
}

// List active sessions
async function listSessions() {
  log.info('Fetching active sessions...');
  
  try {
    const activeSessions = await db.select({
      id: session.id,
      userId: session.userId,
      userEmail: userTable.email,
      userName: userTable.name,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    })
    .from(session)
    .leftJoin(userTable, eq(session.userId, userTable.id))
    .where(gt(session.expiresAt, new Date()))
    .orderBy(session.createdAt);
    
    if (activeSessions.length === 0) {
      log.info('No active sessions found');
      return;
    }

    for (const sess of activeSessions) {
      const user = `${sess.userName || 'Unknown'} (${sess.userEmail})`.padEnd(28);
      const sessionId = sess.id.substring(0, 24) + '...';
      const expires = sess.expiresAt ? new Date(sess.expiresAt).toLocaleString() : 'Never';

    }

  } catch (error) {
    log.error(`Failed to list sessions: ${error}`);
  }
}

// Verify OAuth configuration
async function verifyOAuth(provider?: string) {
  log.info('Verifying OAuth configuration...');
  
  const providers = provider ? [provider] : ['google', 'github'];
  
  for (const p of providers) {

    switch (p) {
      case 'google':
        const googleId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID;
        const googleSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET;
        
        if (googleId && googleSecret) {
          log.success(`Client ID: ${googleId.substring(0, 20)}...`);
          log.success(`Client Secret: ${googleSecret ? '***SET***' : 'NOT SET'}`);
          
          // Check redirect URIs
          const redirectUris = [
            'http://localhost:8081/api/auth/callback/google',
            'http://localhost:3000/api/auth/callback/google',
            'exp://localhost:8081/api/auth/callback/google',
          ];

          redirectUris.forEach(uri => {});
        } else {
          log.error('Google OAuth not configured');
          log.warn('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
        }
        break;
        
      case 'github':
        const githubId = process.env.GITHUB_CLIENT_ID || process.env.AUTH_GITHUB_ID;
        const githubSecret = process.env.GITHUB_CLIENT_SECRET || process.env.AUTH_GITHUB_SECRET;
        
        if (githubId && githubSecret) {
          log.success(`Client ID: ${githubId}`);
          log.success(`Client Secret: ${githubSecret ? '***SET***' : 'NOT SET'}`);
        } else {
          log.warn('GitHub OAuth not configured');
        }
        break;
    }
  }
  
  // Check Better Auth configuration

  const authSecret = process.env.BETTER_AUTH_SECRET;
  const authUrl = process.env.BETTER_AUTH_URL;
  
  if (authSecret) {
    log.success(`Secret: ${authSecret.substring(0, 10)}...`);
  } else {
    log.error('BETTER_AUTH_SECRET not set');
  }
  
  if (authUrl) {
    log.success(`URL: ${authUrl}`);
  } else {
    log.warn('BETTER_AUTH_URL not set (using default)');
  }
}

// Fix common auth issues
async function fixAuthIssues() {
  log.info('Fixing common authentication issues...');
  
  const issues: string[] = [];
  
  // Check for missing environment variables
  if (!process.env.BETTER_AUTH_SECRET) {
    issues.push('Missing BETTER_AUTH_SECRET');
    log.warn('Generating random secret for BETTER_AUTH_SECRET...');
    const secret = require('crypto').randomBytes(32).toString('base64');

  }
  
  // Check for orphaned sessions
  const orphanedSessions = await db.select({ count: sql<number>`count(*)` })
    .from(session)
    .leftJoin(userTable, eq(session.userId, userTable.id))
    .where(sql`${userTable.id} IS NULL`);
  
  if (Number(orphanedSessions[0].count) > 0) {
    issues.push(`Found ${orphanedSessions[0].count} orphaned sessions`);
    log.warn('Cleaning orphaned sessions...');
    
    await db.delete(session)
      .where(sql`user_id NOT IN (SELECT id FROM "user")`);
    
    log.success('Orphaned sessions cleaned');
  }
  
  // Check for accounts without users
  const orphanedAccounts = await db.select({ count: sql<number>`count(*)` })
    .from(account)
    .leftJoin(userTable, eq(account.userId, userTable.id))
    .where(sql`${userTable.id} IS NULL`);
  
  if (Number(orphanedAccounts[0].count) > 0) {
    issues.push(`Found ${orphanedAccounts[0].count} orphaned accounts`);
    log.warn('Cleaning orphaned accounts...');
    
    await db.delete(account)
      .where(sql`user_id NOT IN (SELECT id FROM "user")`);
    
    log.success('Orphaned accounts cleaned');
  }
  
  if (issues.length === 0) {
    log.success('No issues found!');
  } else {
    log.success(`Fixed ${issues.length} issues`);
  }
}

// Debug authentication
async function debugAuth() {
  log.info('Running authentication diagnostics...');

  const requiredEnvVars = [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'EXPO_PUBLIC_API_URL',
  ];
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      log.success(`${envVar}: ${value.substring(0, 30)}...`);
    } else {
      log.error(`${envVar}: NOT SET`);
    }
  }

  // Count users
  const userCount = await db.select({ count: sql<number>`count(*)` }).from(userTable);
  log.info(`Total users: ${userCount[0].count}`);
  
  // Count accounts
  const accountCount = await db.select({ count: sql<number>`count(*)` }).from(account);
  log.info(`Total accounts: ${accountCount[0].count}`);
  
  // Count sessions
  const sessionCount = await db.select({ count: sql<number>`count(*)` }).from(session);
  const activeSessionCount = await db.select({ count: sql<number>`count(*)` })
    .from(session)
    .where(gt(session.expiresAt, new Date()));
  
  log.info(`Total sessions: ${sessionCount[0].count} (${activeSessionCount[0].count} active)`);

  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';
  
  try {
    const healthResponse = await fetch(`${apiUrl}/api/health`);
    if (healthResponse.ok) {
      log.success('API is reachable');
    } else {
      log.error(`API returned status ${healthResponse.status}`);
    }
  } catch (error) {
    log.error(`Cannot reach API: ${error}`);
  }
}

// Clean expired sessions
async function cleanSessions(force: boolean = false) {
  if (!force) {

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  log.info('Cleaning expired sessions...');
  
  try {
    const result = await db.delete(session)
      .where(sql`expires_at < NOW()`);
    
    log.success(`Cleaned ${result.rowCount || 0} expired sessions`);
    
    // Also clean sessions older than 30 days regardless of expiry
    const oldResult = await db.delete(session)
      .where(sql`created_at < NOW() - INTERVAL '30 days'`);
    
    if (oldResult.rowCount) {
      log.success(`Cleaned ${oldResult.rowCount} old sessions (>30 days)`);
    }
    
  } catch (error) {
    log.error(`Failed to clean sessions: ${error}`);
  }
}

// Check OAuth provider status
async function checkOAuthStatus() {
  log.info('Checking OAuth provider status...');
  
  // Check Google OAuth

  const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  
  if (googleConfigured) {
    log.success('Configured');
    
    // Check if any users have Google accounts
    const googleAccounts = await db.select({ count: sql<number>`count(*)` })
      .from(account)
      .where(eq(account.providerId, 'google'));
    
    log.info(`Google accounts: ${googleAccounts[0].count}`);
  } else {
    log.warn('Not configured');
  }
  
  // Check credential accounts (password login)

  const credentialAccounts = await db.select({ count: sql<number>`count(*)` })
    .from(account)
    .where(eq(account.providerId, 'credential'));
  
  log.info(`Password accounts: ${credentialAccounts[0].count}`);
}

// Main execution
async function main() {
  const { action, email, provider, force } = parseArgs();

  try {
    switch (action) {
      case 'test':
        await testAuthFlow(email);
        break;
        
      case 'sessions':
        await listSessions();
        break;
        
      case 'verify':
        await verifyOAuth(provider);
        break;
        
      case 'fix':
        await fixAuthIssues();
        break;
        
      case 'debug':
        await debugAuth();
        break;
        
      case 'clean':
        await cleanSessions(force);
        break;
        
      case 'oauth-status':
        await checkOAuthStatus();
        break;
        
      default:
        log.error(`Unknown action: ${action}`);
        printHelp();
        process.exit(1);
    }
    
    log.success('\nAuthentication management completed successfully!');
  } catch (error) {
    log.error(`Authentication operation failed: ${error}`);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
main().catch(error => {
  log.error(`Unexpected error: ${error}`);
  process.exit(1);
});
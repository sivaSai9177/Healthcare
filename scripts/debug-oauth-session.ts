#!/usr/bin/env bun

/**
 * Debug OAuth Session Issue
 * This script helps diagnose why sessions aren't being found after OAuth
 */

import { db } from '@/src/db';
import * as schema from '@/src/db/schema';
import { desc, eq } from 'drizzle-orm';
import chalk from 'chalk';

async function debugOAuthSession() {
  console.log(chalk.blue('🔍 Debugging OAuth Session Issue\n'));

  try {
    // 1. Check recent sessions
    console.log(chalk.yellow('1. Checking recent sessions...'));
    
    const recentSessions = await db
      .select({
        id: schema.session.id,
        userId: schema.session.userId,
        token: schema.session.token,
        createdAt: schema.session.createdAt,
        expiresAt: schema.session.expiresAt,
        loginMethod: schema.session.loginMethod,
      })
      .from(schema.session)
      .orderBy(desc(schema.session.createdAt))
      .limit(5);
    
    if (recentSessions.length > 0) {
      console.log(`Found ${recentSessions.length} recent sessions:`);
      for (const session of recentSessions) {
        console.log(`\nSession ${session.id}:`);
        console.log(`  User ID: ${session.userId}`);
        console.log(`  Token: ${session.token.substring(0, 20)}...`);
        console.log(`  Login Method: ${session.loginMethod || 'not set'}`);
        console.log(`  Created: ${session.createdAt}`);
        console.log(`  Expires: ${session.expiresAt}`);
        console.log(`  Is Expired: ${new Date(session.expiresAt) < new Date() ? chalk.red('YES') : chalk.green('NO')}`);
      }
    } else {
      console.log(chalk.red('No sessions found in database'));
    }
    
    // 2. Check recent users
    console.log(chalk.yellow('\n2. Checking recent users...'));
    
    const recentUsers = await db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        role: schema.user.role,
        needsProfileCompletion: schema.user.needsProfileCompletion,
        createdAt: schema.user.createdAt,
        emailVerified: schema.user.emailVerified,
      })
      .from(schema.user)
      .orderBy(desc(schema.user.createdAt))
      .limit(5);
    
    if (recentUsers.length > 0) {
      console.log(`Found ${recentUsers.length} recent users:`);
      for (const user of recentUsers) {
        console.log(`\n${chalk.cyan(user.email)}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Needs Profile Completion: ${user.needsProfileCompletion}`);
        console.log(`  Email Verified: ${user.emailVerified}`);
        console.log(`  Created: ${user.createdAt}`);
      }
    } else {
      console.log(chalk.red('No users found in database'));
    }
    
    // 3. Check OAuth accounts
    console.log(chalk.yellow('\n3. Checking OAuth accounts...'));
    
    const oauthAccounts = await db
      .select({
        id: schema.account.id,
        userId: schema.account.userId,
        providerId: schema.account.providerId,
        accountId: schema.account.accountId,
        createdAt: schema.account.createdAt,
      })
      .from(schema.account)
      .where(eq(schema.account.providerId, 'google'))
      .orderBy(desc(schema.account.createdAt))
      .limit(5);
    
    if (oauthAccounts.length > 0) {
      console.log(`Found ${oauthAccounts.length} Google OAuth accounts:`);
      for (const account of oauthAccounts) {
        console.log(`\nAccount ${account.id}:`);
        console.log(`  User ID: ${account.userId}`);
        console.log(`  Google ID: ${account.accountId}`);
        console.log(`  Created: ${account.createdAt}`);
        
        // Check if user has active session
        const userSessions = await db
          .select()
          .from(schema.session)
          .where(eq(schema.session.userId, account.userId))
          .limit(1);
        
        console.log(`  Has Active Session: ${userSessions.length > 0 ? chalk.green('YES') : chalk.red('NO')}`);
      }
    } else {
      console.log(chalk.red('No Google OAuth accounts found'));
    }
    
    // 4. Summary
    console.log(chalk.blue('\n📊 Diagnostic Summary:'));
    console.log('\nPossible issues:');
    console.log('1. Session not being created after OAuth');
    console.log('2. Session cookie not being set properly');
    console.log('3. Better Auth redirect URL mismatch');
    console.log('4. Database write delay');
    
    console.log(chalk.yellow('\n🔧 Debugging Steps:'));
    console.log('1. Enable Auth module: window.debugger.enableModule("Auth")');
    console.log('2. Check browser Network tab for /api/auth/callback/google');
    console.log('3. Check cookies: document.cookie');
    console.log('4. Check OAuth URL parameters in auth-callback');
    
  } catch (error) {
    console.error(chalk.red('❌ Debug failed:'), error);
    process.exit(1);
  }
}

// Run debug
debugOAuthSession()
  .then(() => {
    console.log(chalk.green('\n✅ Debug complete!'));
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
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

  try {
    // 1. Check recent sessions

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

      for (const session of recentSessions) {

      }
    } else {

    }
    
    // 2. Check recent users

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

      for (const user of recentUsers) {

      }
    } else {

    }
    
    // 3. Check OAuth accounts

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

      for (const account of oauthAccounts) {

        // Check if user has active session
        const userSessions = await db
          .select()
          .from(schema.session)
          .where(eq(schema.session.userId, account.userId))
          .limit(1);

      }
    } else {

    }
    
    // 4. Summary

  } catch (error) {
    console.error(chalk.red('❌ Debug failed:'), error);
    process.exit(1);
  }
}

// Run debug
debugOAuthSession()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
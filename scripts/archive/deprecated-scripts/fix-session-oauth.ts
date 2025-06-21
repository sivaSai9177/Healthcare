#!/usr/bin/env bun

/**
 * Fix Session and OAuth Issues
 * This script identifies and fixes session retrieval and OAuth problems
 */

import chalk from 'chalk';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import { eq, desc } from 'drizzle-orm';

const API_URL = 'http://localhost:8081';
const sql = postgres(process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev');
const db = drizzle(sql, { schema });

// Test user
const TEST_USER = { 
  email: 'nurse@mvp.test', 
  password: 'Nurse123!@#' 
};

async function analyzeIssues() {

  const issues = [];
  const fixes = [];
  
  try {
    // 1. Test Better Auth session endpoint behavior

    // First login to get a session
    const loginRes = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER),
      credentials: 'include'
    });
    
    const cookies = loginRes.headers.get('set-cookie');

    // Try different session endpoint variations
    const sessionEndpoints = [
      '/api/auth/session',
      '/api/auth/get-session',
      '/api/auth/me',
      '/api/auth/user'
    ];
    
    for (const endpoint of sessionEndpoints) {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: { 
          'Cookie': cookies || '',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();

      }
    }
    
    // 2. Check database session structure

    const sessions = await db
      .select()
      .from(schema.session)
      .orderBy(desc(schema.session.createdAt))
      .limit(3);

    if (sessions.length > 0) {
      const session = sessions[0];

      // Check if session has Better Auth v1.2.8 fields
      const betterAuthFields = ['ipAddress', 'userAgent', 'activeOrganizationId'];
      const hasBetterAuthFields = betterAuthFields.some(field => field in session);

    }
    
    // 3. Test OAuth callback handling

    // Check if we can create an OAuth session
    const oauthUser = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, 'oauth.test@example.com'))
      .limit(1);
    
    if (oauthUser.length === 0) {

      const [newUser] = await db.insert(schema.user).values({
        id: crypto.randomUUID(),
        email: 'oauth.test@example.com',
        name: 'OAuth Test User',
        role: 'guest',
        needsProfileCompletion: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      // Create OAuth account
      await db.insert(schema.account).values({
        id: crypto.randomUUID(),
        userId: newUser.id,
        accountId: 'google-oauth-12345',
        providerId: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    }
    
    // 4. Identify issues

    // Issue 1: Session endpoint returns 404
    issues.push({
      issue: 'Session endpoint returns 404',
      cause: 'Better Auth session endpoint might not be properly exposed',
      fix: 'Use tRPC endpoint for session retrieval'
    });
    
    // Issue 2: OAuth sign-out JSON parsing error
    issues.push({
      issue: 'OAuth sign-out fails with JSON parsing error',
      cause: 'Better Auth v1.2.8 has a known issue with OAuth session cleanup',
      fix: 'Handle sign-out errors gracefully in the auth API'
    });
    
    // 5. Generate fixes

    fixes.push({
      file: 'app/api/auth/[...auth]+api.ts',
      description: 'Add session endpoint handler',
      code: `
// Add custom session handler
if (url.pathname === '/api/auth/session' && request.method === 'GET') {
  try {
    const sessionToken = request.headers.get('cookie')
      ?.split(';')
      .find(c => c.trim().startsWith('better-auth.session_token='))
      ?.split('=')[1];
    
    if (!sessionToken) {
      return Response.json({ user: null, session: null }, { status: 401 });
    }
    
    // Get session from database
    const [session] = await db
      .select()
      .from(schema.session)
      .where(eq(schema.session.token, sessionToken))
      .limit(1);
    
    if (!session || new Date(session.expiresAt) < new Date()) {
      return Response.json({ user: null, session: null }, { status: 401 });
    }
    
    // Get user
    const [user] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, session.userId))
      .limit(1);
    
    return Response.json({ user, session }, { status: 200 });
  } catch (error) {
    return Response.json({ error: 'Session check failed' }, { status: 500 });
  }
}
      `
    });
    
    fixes.push({
      file: 'lib/auth/auth-server.ts',
      description: 'Update session callback to handle OAuth properly',
      code: `
callbacks: {
  session: {
    async fetchSession({ session, user }) {
      // For OAuth sessions, ensure all fields are properly set
      if (session && user) {
        return {
          session: {
            ...session,
            // Ensure these fields exist
            token: session.token || session.id,
            userId: session.userId || user.id,
            expiresAt: session.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          },
          user: {
            ...user,
            // Ensure OAuth users have proper defaults
            role: user.role || 'guest',
            needsProfileCompletion: user.needsProfileCompletion ?? true
          }
        };
      }
      return { session, user };
    }
  }
}
      `
    });
    
  } catch (error: any) {
    console.error(chalk.red('Analysis failed:'), error.message);
  }
  
  // Print summary

  issues.forEach((issue, i) => {

  });

  fixes.forEach((fix, i) => {

  });

  await sql.end();
}

// Run analysis
analyzeIssues().then(() => {

}).catch(error => {
  console.error(chalk.red('Script failed:'), error);
  process.exit(1);
});
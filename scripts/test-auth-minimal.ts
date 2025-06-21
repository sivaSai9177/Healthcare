#!/usr/bin/env bun
/**
 * Minimal auth test - import and check
 */

// Set NODE_ENV first
// Load environment variables
import 'dotenv/config';

process.env.NODE_ENV = 'production';

console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? 'SET' : 'NOT SET');

// Try to import Better Auth directly
console.log('\nTrying to import Better Auth...');
try {
  const { betterAuth } = require('better-auth');
  console.log('✅ Better Auth imported successfully');
  console.log('   betterAuth type:', typeof betterAuth);
  
  // Try to create a minimal auth instance
  console.log('\nCreating minimal auth instance...');
  
  // Import drizzle adapter
  const { drizzleAdapter } = require('better-auth/adapters/drizzle');
  const { drizzle } = require('drizzle-orm/node-postgres');
  const { Pool } = require('pg');
  
  // Create database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);
  
  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
    }),
    secret: process.env.BETTER_AUTH_SECRET || 'test-secret',
  });
  
  console.log('✅ Auth instance created');
  console.log('   auth type:', typeof auth);
  console.log('   auth.handler type:', typeof auth?.handler);
  
  // Test the handler
  if (auth && typeof auth.handler === 'function') {
    console.log('\nTesting handler...');
    const request = new Request('http://localhost:8081/api/auth/session', {
      method: 'GET',
    });
    
    const response = await auth.handler(request);
    console.log(`✅ Handler responded with status: ${response.status}`);
  }
  
} catch (error: any) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
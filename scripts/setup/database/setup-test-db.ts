#!/usr/bin/env bun
/**
 * Setup test database for integration tests
 */

import { sql } from 'drizzle-orm';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '.env.test' });

const { Client } = pg;

async function setupTestDatabase() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set in .env.test');
    process.exit(1);
  }

  // Parse connection string to get database name
  const dbName = connectionString.split('/').pop()?.split('?')[0] || 'myexpo_test';
  const baseUrl = connectionString.substring(0, connectionString.lastIndexOf('/'));

  // Connect to postgres database to create test database
  const client = new Client({
    connectionString: `${baseUrl}/postgres`,
  });

  try {
    await client.connect();
    
    // Drop existing test database if it exists
    await client.query(`DROP DATABASE IF EXISTS ${dbName}`);

    // Create new test database
    await client.query(`CREATE DATABASE ${dbName}`);

    await client.end();
    
    // Now connect to the test database and run migrations
    const testClient = new Client({
      connectionString,
    });
    
    await testClient.connect();
    
    // You can add schema creation here if needed
    // For now, we'll rely on Drizzle's push command
    
    await testClient.end();

  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  setupTestDatabase();
}
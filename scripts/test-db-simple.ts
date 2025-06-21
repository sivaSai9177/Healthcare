#!/usr/bin/env bun
/**
 * Simple Database Test
 * Tests database connection and tables without importing auth
 */

// Set NODE_ENV to avoid React Native imports
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

process.env.NODE_ENV = 'production';

async function testDatabase() {
  console.log('Testing database connection...\n');
  
  // Check environment variables
  console.log('1. Environment variables:');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('   BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? 'SET' : 'NOT SET');
  console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
  console.log('   GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
  
  if (!process.env.DATABASE_URL) {
    console.error('\n❌ DATABASE_URL is not set!');
    process.exit(1);
  }
  
  try {
    // Create direct database connection
    console.log('\n2. Testing database connection...');
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);
    
    // Test connection
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log('✅ Database connected successfully');
    console.log('   Result:', result);
    
    // Handle different result formats
    const currentTime = result[0]?.current_time || 'Unknown';
    console.log('   Current time:', currentTime);
    
    // Check for tables
    console.log('\n3. Checking existing tables...');
    const tables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `) as any[];
    
    console.log('✅ Found tables:');
    for (const row of tables) {
      console.log(`   - ${row.tablename}`);
    }
    
    // Check specifically for auth tables
    console.log('\n4. Checking for auth tables...');
    const authTables = ['user', 'session', 'account', 'verification'];
    const existingAuthTables = tables
      .map((r: any) => r.tablename as string)
      .filter((name: string) => authTables.includes(name));
    
    if (existingAuthTables.length === 0) {
      console.log('❌ No auth tables found. You may need to run migrations.');
    } else {
      console.log('✅ Found auth tables:', existingAuthTables.join(', '));
      
      // Count rows in each table
      for (const tableName of existingAuthTables) {
        try {
          const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`) as any[];
          console.log(`   - ${tableName}: ${countResult[0].count} rows`);
        } catch (error) {
          console.log(`   - ${tableName}: Error counting rows`);
        }
      }
    }
    
    // Close connection
    await client.end();
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Database error:', error);
    process.exit(1);
  }
}

testDatabase();
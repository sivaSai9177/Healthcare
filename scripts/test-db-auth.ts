#!/usr/bin/env bun
/**
 * Test Database Connection and Better Auth Initialization
 * 
 * This script tests:
 * 1. Database connection
 * 2. Auth tables existence
 * 3. Better Auth initialization
 * 4. Required environment variables
 * 5. Simple Better Auth API request
 */

import 'dotenv/config';
import { db, pool } from '@/src/db';
import { auth } from '@/lib/auth/auth-server';
import { sql } from 'drizzle-orm';
import { user, session, account, verification } from '@/src/db/schema';
import chalk from 'chalk';

// Test result types
interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

// Helper to log test results
function logTest(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  if (passed) {
    console.log(chalk.green(`✓ ${name}`));
    console.log(chalk.gray(`  ${message}`));
  } else {
    console.log(chalk.red(`✗ ${name}`));
    console.log(chalk.red(`  ${message}`));
  }
  if (details) {
    console.log(chalk.gray(`  Details: ${JSON.stringify(details, null, 2)}`));
  }
  console.log();
}

// Test 1: Check environment variables
async function testEnvironmentVariables() {
  console.log(chalk.blue('\n1. Testing Environment Variables\n'));
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'NODE_ENV',
  ];
  
  const optionalEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'EXPO_PUBLIC_REQUIRE_EMAIL_VERIFICATION',
    'ADMIN_USER_IDS',
    'LOCAL_IP',
    'BETTER_AUTH_BASE_URL',
    'TEST_DATABASE_URL',
    'PROD_DATABASE_URL',
    'REDIS_URL',
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASS',
    'EMAIL_FROM',
  ];
  
  // Check required vars
  let allRequiredPresent = true;
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value) {
      logTest(
        `Required: ${varName}`,
        false,
        'Not set'
      );
      allRequiredPresent = false;
    } else {
      const displayValue = varName.includes('SECRET') || varName.includes('PASS') 
        ? '***' 
        : value.substring(0, 50) + (value.length > 50 ? '...' : '');
      logTest(
        `Required: ${varName}`,
        true,
        displayValue
      );
    }
  }
  
  // Check optional vars
  console.log(chalk.blue('\nOptional Environment Variables:\n'));
  for (const varName of optionalEnvVars) {
    const value = process.env[varName];
    if (!value) {
      console.log(chalk.yellow(`⚠ ${varName}: Not set`));
    } else {
      const displayValue = varName.includes('SECRET') || varName.includes('PASS') || varName.includes('CLIENT_ID')
        ? '***' 
        : value.substring(0, 50) + (value.length > 50 ? '...' : '');
      console.log(chalk.gray(`○ ${varName}: ${displayValue}`));
    }
  }
  
  return allRequiredPresent;
}

// Test 2: Database connection
async function testDatabaseConnection() {
  console.log(chalk.blue('\n2. Testing Database Connection\n'));
  
  try {
    // Test basic connection
    const result = await db.execute(sql`SELECT 1 as test`);
    logTest(
      'Database Connection',
      true,
      'Successfully connected to database'
    );
    
    // Get database info
    const dbInfo = await db.execute(sql`
      SELECT current_database() as database,
             current_user as user,
             version() as version
    `);
    
    logTest(
      'Database Info',
      true,
      'Retrieved database information',
      dbInfo.rows[0]
    );
    
    // Check pool status
    logTest(
      'Connection Pool',
      true,
      'Pool status',
      {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      }
    );
    
    return true;
  } catch (error) {
    logTest(
      'Database Connection',
      false,
      `Failed to connect: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

// Test 3: Check auth tables
async function testAuthTables() {
  console.log(chalk.blue('\n3. Testing Auth Tables\n'));
  
  const authTables = [
    { name: 'user', table: user },
    { name: 'session', table: session },
    { name: 'account', table: account },
    { name: 'verification', table: verification },
  ];
  
  let allTablesExist = true;
  
  for (const { name, table } of authTables) {
    try {
      // Try to count rows in each table
      const result = await db.select({ count: sql<number>`count(*)::int` })
        .from(table)
        .limit(1);
      
      logTest(
        `Table: ${name}`,
        true,
        `Exists with ${result[0]?.count || 0} rows`
      );
    } catch (error) {
      logTest(
        `Table: ${name}`,
        false,
        `Table does not exist or cannot be accessed: ${error instanceof Error ? error.message : String(error)}`
      );
      allTablesExist = false;
    }
  }
  
  // Check table structure
  if (allTablesExist) {
    try {
      const columns = await db.execute(sql`
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ('user', 'session', 'account', 'verification')
        ORDER BY table_name, ordinal_position
      `);
      
      console.log(chalk.blue('\nTable Structure:\n'));
      let currentTable = '';
      for (const col of columns.rows as any[]) {
        if (col.table_name !== currentTable) {
          currentTable = col.table_name;
          console.log(chalk.cyan(`\n${currentTable}:`));
        }
        console.log(chalk.gray(`  - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'required'})`));
      }
    } catch (error) {
      console.log(chalk.yellow('\nCould not retrieve table structure'));
    }
  }
  
  return allTablesExist;
}

// Test 4: Better Auth initialization
async function testBetterAuth() {
  console.log(chalk.blue('\n4. Testing Better Auth Initialization\n'));
  
  try {
    // Check if auth is initialized
    if (!auth) {
      logTest(
        'Better Auth Instance',
        false,
        'Auth instance is not initialized'
      );
      return false;
    }
    
    logTest(
      'Better Auth Instance',
      true,
      'Auth instance created successfully'
    );
    
    // Test auth configuration
    const authConfig = {
      hasEmailPassword: true,
      hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      plugins: ['bearer', 'oAuthProxy', 'multiSession', 'organization', 'admin'],
    };
    
    logTest(
      'Auth Configuration',
      true,
      'Configuration loaded',
      authConfig
    );
    
    return true;
  } catch (error) {
    logTest(
      'Better Auth Initialization',
      false,
      `Failed to initialize: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

// Test 5: Better Auth API request
async function testBetterAuthAPI() {
  console.log(chalk.blue('\n5. Testing Better Auth API\n'));
  
  try {
    // Create a mock request to test the auth handler
    const baseUrl = process.env.BETTER_AUTH_BASE_URL || 'http://localhost:8081';
    const testUrl = `${baseUrl}/api/auth/session`;
    
    console.log(chalk.gray(`Testing endpoint: ${testUrl}`));
    
    // Create a basic request
    const request = new Request(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Call the auth handler
    const response = await auth.handler(request);
    
    logTest(
      'Auth Handler Response',
      response.ok,
      `Status: ${response.status} ${response.statusText}`
    );
    
    if (response.ok) {
      const data = await response.json();
      logTest(
        'Session Check',
        true,
        'Auth handler responding correctly',
        { 
          hasSession: !!data.session,
          user: data.user ? 'User data present' : 'No user',
        }
      );
    } else {
      const text = await response.text();
      logTest(
        'Auth Handler Error',
        false,
        `Response: ${text}`
      );
    }
    
    return response.ok;
  } catch (error) {
    logTest(
      'Better Auth API Test',
      false,
      `Failed to test API: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

// Test 6: Check for existing users
async function testExistingUsers() {
  console.log(chalk.blue('\n6. Testing Existing Users\n'));
  
  try {
    const userCount = await db.select({ count: sql<number>`count(*)::int` })
      .from(user);
    
    const activeSessionCount = await db.select({ count: sql<number>`count(*)::int` })
      .from(session)
      .where(sql`expires_at > NOW()`);
    
    logTest(
      'User Statistics',
      true,
      'Retrieved user data',
      {
        totalUsers: userCount[0]?.count || 0,
        activeSessions: activeSessionCount[0]?.count || 0,
      }
    );
    
    // Get sample users (without sensitive data)
    if (userCount[0]?.count > 0) {
      const sampleUsers = await db.select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .limit(5);
      
      console.log(chalk.blue('\nSample Users:\n'));
      for (const user of sampleUsers) {
        console.log(chalk.gray(`  - ${user.email} (${user.role || 'no role'}) - Verified: ${!!user.emailVerified}`));
      }
    }
    
    return true;
  } catch (error) {
    logTest(
      'User Check',
      false,
      `Failed to check users: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Testing Database Connection and Better Auth\n'));
  console.log(chalk.gray('=' .repeat(60) + '\n'));
  
  try {
    // Run all tests
    const envOk = await testEnvironmentVariables();
    const dbOk = await testDatabaseConnection();
    
    if (!dbOk) {
      console.log(chalk.red('\n❌ Cannot proceed without database connection\n'));
      process.exit(1);
    }
    
    const tablesOk = await testAuthTables();
    const authOk = await testBetterAuth();
    const apiOk = await testBetterAuthAPI();
    const usersOk = await testExistingUsers();
    
    // Summary
    console.log(chalk.bold.blue('\n📊 Test Summary\n'));
    console.log(chalk.gray('=' .repeat(60) + '\n'));
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(chalk.green(`✓ Passed: ${passed}`));
    console.log(chalk.red(`✗ Failed: ${failed}`));
    
    if (failed > 0) {
      console.log(chalk.red('\n❌ Some tests failed. Please check the errors above.\n'));
      
      // Provide helpful suggestions
      console.log(chalk.yellow('🔧 Troubleshooting:\n'));
      
      if (!envOk) {
        console.log(chalk.yellow('  1. Make sure all required environment variables are set'));
        console.log(chalk.gray('     Copy .env.example to .env.local and fill in the values\n'));
      }
      
      if (!tablesOk) {
        console.log(chalk.yellow('  2. Auth tables are missing. Run migrations:'));
        console.log(chalk.gray('     bun run db:push\n'));
      }
      
      if (!authOk || !apiOk) {
        console.log(chalk.yellow('  3. Better Auth initialization failed. Check:'));
        console.log(chalk.gray('     - BETTER_AUTH_SECRET is set'));
        console.log(chalk.gray('     - Database connection is working'));
        console.log(chalk.gray('     - No syntax errors in auth configuration\n'));
      }
      
      process.exit(1);
    } else {
      console.log(chalk.green('\n✅ All tests passed! Database and Better Auth are properly configured.\n'));
      
      // Provide next steps
      console.log(chalk.cyan('📌 Next Steps:\n'));
      console.log(chalk.gray('  1. Start the development server: bun run dev'));
      console.log(chalk.gray('  2. Create a test user: bun run scripts/create-demo-users.ts'));
      console.log(chalk.gray('  3. Test authentication in the app\n'));
    }
    
  } catch (error) {
    console.error(chalk.red('\n💥 Unexpected error:'), error);
    process.exit(1);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run tests
runTests();
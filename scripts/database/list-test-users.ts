#!/usr/bin/env bun
/**
 * List test users in the database
 * This helps identify which emails are test accounts vs real users
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, inArray } from 'drizzle-orm';
import { user } from '@/src/db/schema';
import { TEST_USERS } from '../config/test-users';

const connectionString = process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function listTestUsers() {
  try {
    console.log('🔍 Checking for test users in database...\n');
    
    // Get list of test emails
    const testEmails = TEST_USERS.map(u => u.email);
    console.log('📋 Known test emails:', testEmails.join(', '));
    console.log('\n');
    
    // Query database for these emails
    const foundUsers = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified,
      })
      .from(user)
      .where(inArray(user.email, testEmails));
    
    if (foundUsers.length === 0) {
      console.log('✅ No test users found in database\n');
    } else {
      console.log(`⚠️  Found ${foundUsers.length} test user(s) in database:\n`);
      
      foundUsers.forEach((u, index) => {
        console.log(`${index + 1}. ${u.email}`);
        console.log(`   Name: ${u.name}`);
        console.log(`   Role: ${u.role}`);
        console.log(`   Created: ${u.createdAt?.toLocaleString()}`);
        console.log(`   Verified: ${u.emailVerified ? 'Yes' : 'No'}`);
        console.log('');
      });
      
      console.log('💡 Tip: These are test accounts used for development and demos.');
      console.log('   They should not be removed unless you\'re sure they\'re not needed.\n');
    }
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

listTestUsers();
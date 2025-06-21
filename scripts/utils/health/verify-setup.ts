#!/usr/bin/env bun

import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import chalk from 'chalk';

async function verifySetup() {

  try {
    // Test 1: Database connection

    const result = await db.execute(sql`SELECT 1 as test`);

    // Test 2: Check doremon user

    const users = await db.execute(sql`
      SELECT email, role, default_hospital_id 
      FROM "user" 
      WHERE email = 'doremon@gmail.com'
    `);
    
    if (users.rows.length > 0) {

    } else {

    }
    
    // Test 3: Environment variables

    const envVars = {
      'DATABASE_URL': !!process.env.DATABASE_URL,
      'BETTER_AUTH_SECRET': !!process.env.BETTER_AUTH_SECRET,
      'EXPO_PUBLIC_API_URL': !!process.env.EXPO_PUBLIC_API_URL,
      'EXPO_PUBLIC_ENABLE_WS': !!process.env.EXPO_PUBLIC_ENABLE_WS,
    };
    
    Object.entries(envVars).forEach(([key, value]) => {

    });

  } catch (error) {
    console.error(chalk.red('❌ Setup verification failed:'), error);
  }
}

verifySetup().catch(console.error);
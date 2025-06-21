#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function verifyCurrentConnection() {

  try {
    // Get current environment info
    const APP_ENV = process.env.APP_ENV || 'not set';
    const DATABASE_URL = process.env.DATABASE_URL || 'not set';
    const LOCAL_DATABASE_URL = process.env.LOCAL_DATABASE_URL || 'not set';

    // Query database info
    const dbInfo = await db.execute(sql`
      SELECT 
        current_database() as database_name,
        current_user as database_user,
        inet_server_addr() as server_address,
        inet_server_port() as server_port,
        version() as postgres_version
    `);
    
    const info = dbInfo.rows[0];

    // Check if it's local or Neon
    const isLocal = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
    const connectionType = isLocal ? 'LOCAL Docker PostgreSQL' : 'Neon Cloud Database';

    // Count records in key tables
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM "user"`);
    const alertCount = await db.execute(sql`SELECT COUNT(*) as count FROM alerts`);
    const hospitalCount = await db.execute(sql`SELECT COUNT(*) as count FROM hospitals`);

    // Check specific users
    const testUsers = await db.execute(sql`
      SELECT email, role, default_hospital_id 
      FROM "user" 
      WHERE email IN ('doremon@gmail.com', 'saipramod273@gmail.com')
    `);
    
    if (testUsers.rows.length > 0) {

      testUsers.rows.forEach((user: any) => {

      });
    }
    
  } catch (error) {
    console.error('❌ Failed to verify database connection:', error);
  }
  
  process.exit(0);
}

verifyCurrentConnection();
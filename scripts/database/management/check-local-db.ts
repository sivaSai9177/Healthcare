#!/usr/bin/env bun
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { getDatabaseUrl } from '../../config/utils';

// Get local database URL from config
const LOCAL_DATABASE_URL = process.env.DATABASE_URL || getDatabaseUrl();

async function checkLocalDatabase() {

  const pool = new Pool({
    connectionString: LOCAL_DATABASE_URL,
    ssl: false,
  });
  
  const localDb = drizzle(pool);
  
  try {
    // Test connection
    await localDb.execute(sql`SELECT current_database(), current_user, version()`);

    // List all tables

    const tables = await localDb.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    if (tables.rows.length === 0) {

    } else {

      tables.rows.forEach((row: any) => {

      });
    }
    
    // Check for users if user table exists
    const userTableExists = tables.rows.some((row: any) => row.tablename === 'user');
    
    if (userTableExists) {

      const users = await localDb.execute(sql`
        SELECT id, email, name, role, created_at
        FROM "user"
        ORDER BY created_at DESC
        LIMIT 10;
      `);
      
      if (users.rows.length === 0) {

      } else {
        users.rows.forEach((user: any, i) => {

        });
      }
    }
    
    // Check for alerts if alerts table exists
    const alertsTableExists = tables.rows.some((row: any) => row.tablename === 'alerts');
    
    if (alertsTableExists) {

      const alerts = await localDb.execute(sql`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
               COUNT(CASE WHEN urgency_level <= 2 THEN 1 END) as critical
        FROM alerts;
      `);
      
      const stats = alerts.rows[0] as any;

    }
    
    // Check database info

    const dbInfo = await localDb.execute(sql`
      SELECT 
        current_database() as database,
        pg_database_size(current_database()) as size,
        current_user as user
    `);
    
    const info = dbInfo.rows[0] as any;

  } catch (error) {
    console.error('❌ Error connecting to local database:', error);

  } finally {
    await pool.end();
  }
  
  process.exit(0);
}

checkLocalDatabase();
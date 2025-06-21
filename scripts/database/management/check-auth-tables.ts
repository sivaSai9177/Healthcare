#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

// Force local database connection
process.env.APP_ENV = 'local';
process.env.DATABASE_URL = 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';

async function checkAuthTables() {

  try {
    // List all tables
    const tablesResult = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND (
        tablename LIKE '%auth%' OR 
        tablename LIKE '%account%' OR 
        tablename LIKE '%session%' OR
        tablename LIKE '%user%'
      )
      ORDER BY tablename;
    `);

    tablesResult.rows.forEach((row: any) => {

    });
    
    // Check for nurse user with hospital info

    const userResult = await db.execute(sql`
      SELECT 
        u.*,
        hu.hospital_id as healthcare_hospital_id,
        hu.department,
        hu.is_on_duty
      FROM "user" u
      LEFT JOIN healthcare_users hu ON hu.user_id = u.id
      WHERE u.email = 'doremon@gmail.com'
    `);
    
    const user = userResult.rows[0];
    if (user) {

      // Update hospital IDs if mismatched
      if (user.default_hospital_id !== 'f155b026-01bd-4212-94f3-e7aedef2801d') {

        await db.execute(sql`
          UPDATE "user"
          SET default_hospital_id = 'f155b026-01bd-4212-94f3-e7aedef2801d'
          WHERE id = ${user.id}
        `);

      }
      
      if (user.healthcare_hospital_id !== 'f155b026-01bd-4212-94f3-e7aedef2801d') {

        await db.execute(sql`
          UPDATE healthcare_users
          SET hospital_id = 'f155b026-01bd-4212-94f3-e7aedef2801d'
          WHERE user_id = ${user.id}
        `);

      }
    } else {

    }
    
    // Check sessions

    const sessionsResult = await db.execute(sql`
      SELECT COUNT(*) as total_sessions,
             COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_sessions
      FROM session
    `);
    
    const sessionStats = sessionsResult.rows[0];

    // Check hospital

    const hospitalResult = await db.execute(sql`
      SELECT * FROM hospitals
      WHERE id = 'f155b026-01bd-4212-94f3-e7aedef2801d'
    `);
    
    const hospital = hospitalResult.rows[0];
    if (hospital) {

    } else {

    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkAuthTables();
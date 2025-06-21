#!/usr/bin/env bun
import { db } from '@/src/db';
import { eq, sql } from 'drizzle-orm';

// Force local database connection
process.env.APP_ENV = 'local';
process.env.DATABASE_URL = 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';

async function checkNurseUser() {

  try {
    // Check user table
    const nurseUserResult = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.default_hospital_id,
        u.created_at,
        u.updated_at
      FROM "user" u
      WHERE u.email = 'doremon@gmail.com'
    `);
    
    const nurseUser = nurseUserResult.rows[0];
    
    if (!nurseUser) {

      return;
    }

    // Check healthcare_users table
    const healthcareProfileResult = await db.execute(sql`
      SELECT 
        hu.user_id,
        hu.hospital_id,
        hu.license_number,
        hu.department,
        hu.specialization,
        hu.is_on_duty,
        hu.shift_start_time,
        hu.shift_end_time
      FROM healthcare_users hu
      WHERE hu.user_id = ${nurseUser.id}
    `);
    
    const healthcareProfile = healthcareProfileResult.rows[0];
    
    if (!healthcareProfile) {

      await db.execute(sql`
        INSERT INTO healthcare_users (
          user_id,
          hospital_id,
          license_number,
          department,
          specialization,
          is_on_duty
        ) VALUES (
          ${nurseUser.id},
          'f155b026-01bd-4212-94f3-e7aedef2801d',
          ${'NUR-' + nurseUser.id.substring(0, 8)},
          'ICU',
          'Critical Care',
          false
        )
        ON CONFLICT (user_id) DO UPDATE SET
          hospital_id = EXCLUDED.hospital_id,
          department = EXCLUDED.department,
          specialization = EXCLUDED.specialization
      `);

    } else {

      if (healthcareProfile.shift_start_time) {

      }
    }
    
    // Check account and session tables

    const accountResult = await db.execute(sql`
      SELECT 
        provider_id,
        account_id,
        created_at
      FROM account
      WHERE user_id = ${nurseUser.id}
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    const account = accountResult.rows[0];
    
    if (account) {

    } else {

    }
    
    // Check for active sessions
    const sessions = await db.execute(sql`
      SELECT 
        id,
        expires_at,
        created_at,
        updated_at
      FROM session
      WHERE user_id = ${nurseUser.id}
      AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 3
    `);
    
    if (sessions.rows.length > 0) {

      sessions.rows.forEach((session: any, i: number) => {

      });
    } else {

    }
    
    // Summary

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkNurseUser();
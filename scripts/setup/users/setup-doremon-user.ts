#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function setupDoremonUser() {

  const userId = 'd9df4085-3f0c-4505-a92e-d5aef896b186';
  const hospitalId = 'f155b026-01bd-4212-94f3-e7aedef2801d';
  
  try {
    // Show user info

    // Check and add to healthcare_users
    const healthcareCheck = await db.execute(sql`
      SELECT * FROM healthcare_users WHERE user_id = ${userId};
    `);
    
    if (healthcareCheck.rows.length === 0) {

      await db.execute(sql`
        INSERT INTO healthcare_users (
          user_id,
          hospital_id,
          department,
          is_on_duty,
          shift_start_time
        ) VALUES (
          ${userId},
          ${hospitalId},
          'Emergency',
          true,
          NOW()
        );
      `);

    } else {

      // Update to ensure correct hospital and on-duty status
      await db.execute(sql`
        UPDATE healthcare_users 
        SET 
          hospital_id = ${hospitalId},
          is_on_duty = true,
          department = 'Emergency',
          shift_start_time = NOW()
        WHERE user_id = ${userId};
      `);

    }
    
    // Verify setup

    // Check final state
    const finalCheck = await db.execute(sql`
      SELECT 
        u.email,
        u.name,
        u.role,
        u."default_hospital_id",
        hu.hospital_id,
        hu.department,
        hu.is_on_duty,
        h.name as hospital_name
      FROM "user" u
      LEFT JOIN healthcare_users hu ON hu.user_id = u.id
      LEFT JOIN hospitals h ON h.id = COALESCE(u."default_hospital_id", hu.hospital_id)
      WHERE u.id = ${userId};
    `);
    
    if (finalCheck.rows.length > 0) {
      const user = finalCheck.rows[0] as any;

    }
    
    // Check available alerts
    const alerts = await db.execute(sql`
      SELECT 
        id, 
        room_number, 
        alert_type, 
        urgency_level, 
        status,
        created_at
      FROM alerts
      WHERE hospital_id = ${hospitalId}
      AND status IN ('active', 'acknowledged')
      ORDER BY urgency_level ASC, created_at DESC;
    `);

    alerts.rows.forEach((alert: any, index) => {

    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

setupDoremonUser();
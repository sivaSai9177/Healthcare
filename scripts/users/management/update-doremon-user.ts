#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function updateDoremonUser() {

  const userId = 'd9df4085-3f0c-4505-a92e-d5aef896b186';
  const hospitalId = 'f155b026-01bd-4212-94f3-e7aedef2801d';
  
  try {
    // Check current state

    // Check if user exists in healthcare_users table
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
          shift_start,
          current_location
        ) VALUES (
          ${userId},
          ${hospitalId},
          'Emergency',
          true,
          ${new Date().toISOString()},
          'Ward A'
        );
      `);

    } else {

      // Update to ensure correct hospital
      await db.execute(sql`
        UPDATE healthcare_users 
        SET 
          hospital_id = ${hospitalId},
          is_on_duty = true,
          department = 'Emergency'
        WHERE user_id = ${userId};
      `);

    }
    
    // Verify the user can access alerts

    // Check alerts for this hospital
    const alerts = await db.execute(sql`
      SELECT id, room_number, alert_type, urgency_level, status
      FROM alerts
      WHERE hospital_id = ${hospitalId}
      AND status IN ('active', 'acknowledged')
      ORDER BY urgency_level DESC, created_at DESC;
    `);

    alerts.rows.forEach((alert: any, index) => {

    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

updateDoremonUser();
#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

// Force local database connection
process.env.APP_ENV = 'local';
process.env.DATABASE_URL = 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';

async function testDoctorRole() {

  try {
    // 1. Verify user setup

    const userResult = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.organization_id,
        u.default_hospital_id,
        hu.hospital_id,
        hu.department,
        hu.specialization,
        hu.license_number,
        hu.is_on_duty,
        o.name as org_name,
        h.name as hospital_name
      FROM "user" u
      LEFT JOIN healthcare_users hu ON hu.user_id = u.id
      LEFT JOIN organization o ON o.id = u.organization_id
      LEFT JOIN hospitals h ON h.id = u.default_hospital_id
      WHERE u.email = 'saipramod273@gmail.com'
    `);
    
    const doctor = userResult.rows[0];
    if (!doctor) {

      // First check if we need to create the user
      const existingUserResult = await db.execute(sql`
        SELECT id FROM "user" WHERE email = 'saipramod273@gmail.com'
      `);
      
      if (existingUserResult.rows.length === 0) {

        return;
      }
    } else {

      // Update if needed
      if (doctor.role !== 'head_doctor' || !doctor.default_hospital_id) {

        await db.execute(sql`
          UPDATE "user"
          SET 
            role = 'head_doctor',
            name = 'Dr. Saipramod (Head)',
            organization_id = 'f155b026-01bd-4212-94f3-e7aedef2801d',
            default_hospital_id = 'f155b026-01bd-4212-94f3-e7aedef2801d'
          WHERE id = ${doctor.id}
        `);
        
        // Ensure healthcare profile exists
        if (!doctor.hospital_id) {
          await db.execute(sql`
            INSERT INTO healthcare_users (
              user_id,
              hospital_id,
              license_number,
              department,
              specialization,
              is_on_duty
            ) VALUES (
              ${doctor.id},
              'f155b026-01bd-4212-94f3-e7aedef2801d',
              ${'HDR-' + doctor.id.substring(0, 8)},
              'Cardiology',
              'Cardiology',
              false
            )
            ON CONFLICT (user_id) DO UPDATE SET
              hospital_id = EXCLUDED.hospital_id,
              department = EXCLUDED.department,
              specialization = EXCLUDED.specialization
          `);
        }

      }
    }
    
    // 2. Test API endpoints

    // Check permissions

    // 3. Check alert statistics

    const alertStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_alerts,
        COUNT(CASE WHEN urgency_level <= 2 THEN 1 END) as critical_alerts,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_alerts
      FROM alerts
      WHERE hospital_id = 'f155b026-01bd-4212-94f3-e7aedef2801d'
    `);
    
    const stats = alertStats.rows[0];

    // 4. Check department staff

    const staffResult = await db.execute(sql`
      SELECT 
        u.name,
        u.role,
        hu.is_on_duty
      FROM healthcare_users hu
      JOIN "user" u ON u.id = hu.user_id
      WHERE hu.department = 'Cardiology'
        AND hu.hospital_id = 'f155b026-01bd-4212-94f3-e7aedef2801d'
    `);
    
    if (staffResult.rows.length > 0) {

      staffResult.rows.forEach((staff: any) => {

      });
    } else {

    }
    
    // Summary

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

testDoctorRole();
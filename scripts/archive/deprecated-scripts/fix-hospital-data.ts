#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

// Force local database connection
process.env.APP_ENV = 'local';
process.env.DATABASE_URL = 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';

async function fixHospitalData() {

  try {
    // 1. Create Dubai Central Hospital

    await db.execute(sql`
      INSERT INTO hospitals (
        id,
        organization_id,
        name,
        code,
        address,
        contact_info,
        is_active,
        is_default
      ) VALUES (
        'f155b026-01bd-4212-94f3-e7aedef2801d',
        'f155b026-01bd-4212-94f3-e7aedef2801d', -- Using same ID for organization
        'Dubai Central Hospital',
        'DCH',
        '123 Healthcare Blvd, Dubai, UAE',
        '{"phone": "+971-4-123-4567", "email": "admin@dubaihospital.ae"}'::jsonb,
        true,
        true
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        organization_id = EXCLUDED.organization_id,
        is_active = EXCLUDED.is_active,
        is_default = EXCLUDED.is_default
    `);

    // 2. Check what hospital IDs exist in healthcare_users

    const hospitalStats = await db.execute(sql`
      SELECT 
        hospital_id,
        COUNT(*) as user_count
      FROM healthcare_users
      GROUP BY hospital_id
    `);

    hospitalStats.rows.forEach((stat: any) => {

    });
    
    // 3. Update all healthcare users to use Dubai Central Hospital

    await db.execute(sql`
      UPDATE healthcare_users
      SET hospital_id = 'f155b026-01bd-4212-94f3-e7aedef2801d'
      WHERE hospital_id != 'f155b026-01bd-4212-94f3-e7aedef2801d'
    `);
    
    // 4. Update all users' defaultHospitalId

    await db.execute(sql`
      UPDATE "user"
      SET default_hospital_id = 'f155b026-01bd-4212-94f3-e7aedef2801d'
      WHERE role IN ('nurse', 'doctor', 'operator', 'head_nurse', 'head_doctor', 'healthcare_admin')
        AND (default_hospital_id IS NULL OR default_hospital_id != 'f155b026-01bd-4212-94f3-e7aedef2801d')
    `);
    
    // 5. Create organization if missing

    const orgResult = await db.execute(sql`
      SELECT id, name FROM organization
      WHERE id = 'f155b026-01bd-4212-94f3-e7aedef2801d'
    `);
    
    if (orgResult.rows.length === 0) {

      await db.execute(sql`
        INSERT INTO organization (
          id,
          name,
          slug,
          description,
          settings
        ) VALUES (
          'f155b026-01bd-4212-94f3-e7aedef2801d',
          'Dubai Central Hospital',
          'dubai-central-hospital',
          'Premier healthcare facility in Dubai',
          '{}'::jsonb
        )
      `);

    } else {

    }
    
    // 6. Update alerts to use correct hospital

    await db.execute(sql`
      UPDATE alerts
      SET hospital_id = 'f155b026-01bd-4212-94f3-e7aedef2801d'
      WHERE hospital_id != 'f155b026-01bd-4212-94f3-e7aedef2801d'
    `);
    
    // 7. Verify nurse user

    const nurseResult = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.default_hospital_id,
        hu.hospital_id as healthcare_hospital_id,
        hu.department,
        hu.is_on_duty
      FROM "user" u
      LEFT JOIN healthcare_users hu ON hu.user_id = u.id
      WHERE u.email = 'doremon@gmail.com'
    `);
    
    const nurse = nurseResult.rows[0];
    if (nurse) {

    }
    
    // Summary

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

fixHospitalData();
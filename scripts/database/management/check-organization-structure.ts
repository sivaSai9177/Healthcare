#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

// Force local database connection
process.env.APP_ENV = 'local';
process.env.DATABASE_URL = 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';

async function checkOrganizationStructure() {

  try {
    // Get table columns
    const columnsResult = await db.execute(sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'organization'
      ORDER BY ordinal_position;
    `);

    columnsResult.rows.forEach((col: any) => {

    });
    
    // Check existing organizations

    const orgsResult = await db.execute(sql`
      SELECT id, name, created_at
      FROM organization
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (orgsResult.rows.length === 0) {

    } else {
      orgsResult.rows.forEach((org: any) => {

      });
    }
    
    // Create organization with correct columns

    await db.execute(sql`
      INSERT INTO organization (
        id,
        name,
        created_at,
        updated_at
      ) VALUES (
        'f155b026-01bd-4212-94f3-e7aedef2801d',
        'Dubai Central Hospital',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    `);

    // Update all healthcare users' organization

    await db.execute(sql`
      UPDATE "user"
      SET organization_id = 'f155b026-01bd-4212-94f3-e7aedef2801d'
      WHERE role IN ('nurse', 'doctor', 'operator', 'head_nurse', 'head_doctor', 'healthcare_admin')
        AND (organization_id IS NULL OR organization_id != 'f155b026-01bd-4212-94f3-e7aedef2801d')
    `);

    // Verify nurse user final state

    const finalResult = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.organization_id,
        u.default_hospital_id,
        hu.hospital_id,
        hu.department,
        o.name as org_name,
        h.name as hospital_name
      FROM "user" u
      LEFT JOIN healthcare_users hu ON hu.user_id = u.id
      LEFT JOIN organization o ON o.id = u.organization_id
      LEFT JOIN hospitals h ON h.id = u.default_hospital_id
      WHERE u.email = 'doremon@gmail.com'
    `);
    
    const user = finalResult.rows[0];
    if (user) {

    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkOrganizationStructure();
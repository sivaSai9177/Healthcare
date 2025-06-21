#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/core/debug/logger';

async function fixHospitalOrganizationId() {

  log.info('Fixing hospital organization_id...', 'FIX');
  
  try {
    // First, check if organization exists
    const orgCheck = await db.execute(sql`
      SELECT id FROM organization WHERE id = 'f155b026-01bd-4212-94f3-e7aedef2801d'
    `);
    
    if (orgCheck.rows.length === 0) {

      log.info('Creating default organization...', 'FIX');
      await db.execute(sql`
        INSERT INTO organization (id, name, slug, type, size, email, plan, status)
        VALUES (
          'f155b026-01bd-4212-94f3-e7aedef2801d',
          'Dubai Healthcare Network',
          'dubai-healthcare',
          'healthcare',
          'large',
          'admin@dubaihealthcare.ae',
          'enterprise',
          'active'
        )
      `);
    }
    
    // Check if hospitals table has organization_id column
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'hospitals' 
      AND column_name = 'organization_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      log.info('Adding organization_id column to hospitals table...', 'FIX');
      await db.execute(sql`
        ALTER TABLE hospitals 
        ADD COLUMN organization_id UUID NOT NULL DEFAULT 'f155b026-01bd-4212-94f3-e7aedef2801d'
      `);
      
      // Remove the default constraint after adding the column
      await db.execute(sql`
        ALTER TABLE hospitals 
        ALTER COLUMN organization_id DROP DEFAULT
      `);
    }
    
    // Update existing hospitals to have organization_id
    log.info('Updating hospitals with organization_id...', 'FIX');
    const updateResult = await db.execute(sql`
      UPDATE hospitals 
      SET organization_id = 'f155b026-01bd-4212-94f3-e7aedef2801d',
          code = COALESCE(code, 'DCH-001'),
          is_default = COALESCE(is_default, true)
      WHERE organization_id IS NULL
    `);
    
    log.info(`Updated ${updateResult.rowCount} hospitals`, 'FIX');
    
    // Verify the fix
    const hospitals = await db.execute(sql`
      SELECT id, name, organization_id, code, is_default 
      FROM hospitals
    `);
    
    log.info('Current hospitals:', 'FIX');
    hospitals.rows.forEach((hospital: any) => {
      log.info(`- ${hospital.name} (${hospital.code}): org_id=${hospital.organization_id}, default=${hospital.is_default}`, 'FIX');
    });

    log.info('✅ Hospital organization_id fix completed successfully!', 'FIX');
    
  } catch (error) {
    console.error('❌ Failed to fix hospital organization_id:', error);
    log.error('Failed to fix hospital organization_id', 'FIX', error);
    throw error;
  }
}

// Run the fix
fixHospitalOrganizationId()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
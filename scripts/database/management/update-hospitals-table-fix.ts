#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function updateHospitalsTable() {

  try {
    // Add missing columns to hospitals table

    await db.execute(sql`
      ALTER TABLE hospitals 
      ADD COLUMN IF NOT EXISTS organization_id UUID;
    `);

    await db.execute(sql`
      ALTER TABLE hospitals 
      ADD COLUMN IF NOT EXISTS code VARCHAR(50);
    `);

    await db.execute(sql`
      ALTER TABLE hospitals 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);

    await db.execute(sql`
      ALTER TABLE hospitals 
      ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
    `);

    // Update existing hospital with organization
    const orgs = await db.execute(sql`SELECT id, name FROM organization LIMIT 1;`);
    if (orgs.rows.length > 0) {
      const orgId = orgs.rows[0].id;

      await db.execute(sql`
        UPDATE hospitals 
        SET 
          organization_id = ${orgId},
          code = 'DCH',
          is_active = true,
          is_default = true
        WHERE organization_id IS NULL;
      `);

    }
    
    // Verify the update
    const hospitals = await db.execute(sql`
      SELECT id, name, organization_id, code, is_default 
      FROM hospitals;
    `);

    hospitals.rows.forEach((hospital: any) => {

    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

updateHospitalsTable();
#!/usr/bin/env tsx
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function updateHospitalsTable() {

  try {
    // Add missing columns

    await db.execute(sql`
      ALTER TABLE hospitals 
      ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '0d375139-d17c-4c39-aa74-7e8f6a37e235'
    `);

    await db.execute(sql`
      ALTER TABLE hospitals 
      ADD COLUMN IF NOT EXISTS code VARCHAR(50) NOT NULL DEFAULT 'HOSP-001'
    `);

    await db.execute(sql`
      ALTER TABLE hospitals 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
    `);

    await db.execute(sql`
      ALTER TABLE hospitals 
      ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false
    `);
    
    // Create indexes

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_hospital_org_default ON hospitals(organization_id, is_default)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_hospital_code ON hospitals(code)
    `);

    // Remove default constraint after adding the column

    await db.execute(sql`
      ALTER TABLE hospitals ALTER COLUMN organization_id DROP DEFAULT
    `);

  } catch (error) {
    console.error('❌ Error updating table:', error);
  }
  
  process.exit(0);
}

updateHospitalsTable();
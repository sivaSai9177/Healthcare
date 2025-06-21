#!/usr/bin/env tsx
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function addHospitalColumn() {

  try {
    // Add the column
    await db.execute(sql`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS default_hospital_id UUID
    `);

    // Add comment
    await db.execute(sql`
      COMMENT ON COLUMN "user".default_hospital_id IS 'Default hospital within the organization'
    `);

  } catch (error) {
    console.error('❌ Error adding column:', error);
  }
  
  process.exit(0);
}

addHospitalColumn();
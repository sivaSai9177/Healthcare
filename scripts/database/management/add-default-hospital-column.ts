#!/usr/bin/env bun

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function addDefaultHospitalColumn() {

  try {
    // Add column
    await db.execute(sql`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS "default_hospital_id" text
    `);

    // Try to add foreign key constraint (may fail if already exists)
    try {
      await db.execute(sql`
        ALTER TABLE "user"
        ADD CONSTRAINT "user_default_hospital_id_fkey" 
        FOREIGN KEY ("default_hospital_id") 
        REFERENCES "hospitals"("id") 
        ON DELETE SET NULL
      `);

    } catch (err: any) {
      if (err.message.includes('already exists')) {

      } else {
        throw err;
      }
    }
    
    // Update doremon user with default hospital
    const result = await db.execute(sql`
      UPDATE "user" 
      SET "default_hospital_id" = (
        SELECT hospital_id 
        FROM healthcare_users 
        WHERE healthcare_users.user_id = "user".id
        LIMIT 1
      )
      WHERE email = 'doremon@gmail.com'
      AND "default_hospital_id" IS NULL
    `);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

addDefaultHospitalColumn().catch(console.error);
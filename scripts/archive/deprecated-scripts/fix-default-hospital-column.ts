#!/usr/bin/env bun

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function fixDefaultHospitalColumn() {

  try {
    // First drop the column if it exists with wrong type
    try {
      await db.execute(sql`
        ALTER TABLE "user" 
        DROP COLUMN IF EXISTS "default_hospital_id"
      `);

    } catch (err) {

    }
    
    // Add column with correct UUID type
    await db.execute(sql`
      ALTER TABLE "user" 
      ADD COLUMN "default_hospital_id" uuid
    `);

    // Add foreign key constraint
    await db.execute(sql`
      ALTER TABLE "user"
      ADD CONSTRAINT "user_default_hospital_id_fkey" 
      FOREIGN KEY ("default_hospital_id") 
      REFERENCES "hospitals"("id") 
      ON DELETE SET NULL
    `);

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

    // Verify the update
    const [user] = await db.execute(sql`
      SELECT id, email, role, default_hospital_id 
      FROM "user" 
      WHERE email = 'doremon@gmail.com'
    `);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

fixDefaultHospitalColumn().catch(console.error);
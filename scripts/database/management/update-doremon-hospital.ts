#!/usr/bin/env bun

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function updateDoraemonHospital() {

  try {
    // Update with proper type casting
    const result = await db.execute(sql`
      UPDATE "user" 
      SET "default_hospital_id" = (
        SELECT hospital_id::uuid 
        FROM healthcare_users 
        WHERE healthcare_users.user_id = "user".id
        LIMIT 1
      )
      WHERE email = 'doremon@gmail.com'
      AND "default_hospital_id" IS NULL
    `);

    // Verify the update
    const users = await db.execute(sql`
      SELECT u.id, u.email, u.role, u.default_hospital_id, hu.hospital_id
      FROM "user" u
      LEFT JOIN healthcare_users hu ON u.id = hu.user_id
      WHERE u.email = 'doremon@gmail.com'
    `);

  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

updateDoraemonHospital().catch(console.error);
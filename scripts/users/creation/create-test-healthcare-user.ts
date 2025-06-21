#!/usr/bin/env bun

import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function createTestHealthcareUser() {

  try {
    // First, check if hospitals table exists and has data

    const hospitalsCheck = await db.execute(sql`
      SELECT COUNT(*) as count FROM hospitals
    `);
    
    let hospitalId: string;
    
    if (parseInt(hospitalsCheck.rows[0].count) === 0) {

      // Create a test hospital
      const hospitalResult = await db.execute(sql`
        INSERT INTO hospitals (id, name, code, is_active, is_default)
        VALUES (gen_random_uuid(), 'Test Hospital', 'TEST001', true, true)
        RETURNING id
      `);
      
      hospitalId = hospitalResult.rows[0].id;

    } else {
      // Get first hospital
      const hospital = await db.execute(sql`
        SELECT id FROM hospitals LIMIT 1
      `);
      hospitalId = hospital.rows[0].id;

    }
    
    // Create doremon user

    const userId = `user_${nanoid()}`;
    
    // Check if user already exists
    const existingUser = await db.execute(sql`
      SELECT id FROM "user" WHERE email = 'doremon@gmail.com'
    `);
    
    if (existingUser.rows.length > 0) {

      await db.execute(sql`
        UPDATE "user"
        SET default_hospital_id = ${hospitalId}::uuid,
            role = 'nurse'
        WHERE email = 'doremon@gmail.com'
      `);

    } else {
      // User doesn't exist, need to handle auth properly

      return;
    }
    
    // Add to healthcare_users if not exists

    const healthcareUserExists = await db.execute(sql`
      SELECT user_id FROM healthcare_users WHERE user_id = (
        SELECT id FROM "user" WHERE email = 'doremon@gmail.com'
      )
    `);
    
    if (healthcareUserExists.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO healthcare_users (user_id, hospital_id, department, is_on_duty)
        SELECT id, ${hospitalId}, 'Emergency', false
        FROM "user" 
        WHERE email = 'doremon@gmail.com'
      `);

    } else {

    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

createTestHealthcareUser().catch(console.error);
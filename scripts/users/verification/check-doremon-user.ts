#!/usr/bin/env bun

import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function checkDoremonUser() {

  try {
    // Check if user exists
    const userResult = await db.execute(sql`
      SELECT id, email, role, default_hospital_id, "organizationId", name
      FROM "user" 
      WHERE email = 'doremon@gmail.com'
    `);
    
    if (userResult.rows.length === 0) {

      // Check what users do exist
      const allUsers = await db.execute(sql`
        SELECT email, role, name FROM "user" ORDER BY created_at DESC LIMIT 10
      `);

      allUsers.rows.forEach(user => {

      });
      
      return;
    }
    
    const user = userResult.rows[0];

    // Check healthcare_users
    const healthcareResult = await db.execute(sql`
      SELECT hospital_id, department, is_on_duty
      FROM healthcare_users
      WHERE user_id = ${user.id}
    `);
    
    if (healthcareResult.rows.length > 0) {
      const healthcare = healthcareResult.rows[0];

    } else {

    }
    
    // Check hospital details
    if (user.default_hospital_id) {
      const hospitalResult = await db.execute(sql`
        SELECT name, organization_id
        FROM hospitals
        WHERE id = ${user.default_hospital_id}
      `);
      
      if (hospitalResult.rows.length > 0) {

      }
    }
    
  } catch (error) {
    console.error('Error checking user:', error);
  }
}

checkDoremonUser().catch(console.error);
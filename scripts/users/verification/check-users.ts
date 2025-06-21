#!/usr/bin/env bun

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function checkUsers() {

  try {
    // Get all users
    const users = await db.execute(sql`
      SELECT id, email, role, default_hospital_id 
      FROM "user" 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    users.rows.forEach((user: any) => {

    });
    
    // Check healthcare_users table

    const healthcareUsers = await db.execute(sql`
      SELECT hu.user_id, hu.hospital_id, u.email, u.role
      FROM healthcare_users hu
      JOIN "user" u ON hu.user_id = u.id
      LIMIT 10
    `);

    healthcareUsers.rows.forEach((hu: any) => {

    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers().catch(console.error);
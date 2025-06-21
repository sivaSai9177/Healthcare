#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function findDoremonUser() {

  try {
    // Direct SQL query to check all users
    const result = await db.execute(sql`
      SELECT id, email, name, role, "emailVerified", "defaultHospitalId", "organizationId", "createdAt"
      FROM "user"
      WHERE email ILIKE '%doremon%'
      ORDER BY "createdAt" DESC;
    `);
    
    if (result.rows.length === 0) {

      // List all users

      const allUsers = await db.execute(sql`
        SELECT email, name, role, "createdAt"
        FROM "user"
        ORDER BY "createdAt" DESC;
      `);
      
      allUsers.rows.forEach((user: any, index) => {

      });
    } else {

      result.rows.forEach((user: any) => {

      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

findDoremonUser();
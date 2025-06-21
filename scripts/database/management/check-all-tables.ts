#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function checkAllTables() {

  try {
    // Check user table structure

    const userColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user'
      ORDER BY ordinal_position;
    `);
    
    userColumns.rows.forEach((col: any) => {

    });
    
    // Check if doremon exists

    const doremonCheck = await db.execute(sql`
      SELECT id, email, name, role FROM "user" 
      WHERE email = 'doremon@gmail.com';
    `);
    
    if (doremonCheck.rows.length > 0) {
      const user = doremonCheck.rows[0] as any;

    } else {

    }
    
    // Check healthcare_users table

    const healthcareColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'healthcare_users'
      ORDER BY ordinal_position;
    `);
    
    healthcareColumns.rows.forEach((col: any) => {

    });
    
    // Check hospitals table

    const hospitalColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'hospitals'
      ORDER BY ordinal_position;
    `);
    
    hospitalColumns.rows.forEach((col: any) => {

    });
    
    // Check alerts table

    const alertColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'alerts'
      ORDER BY ordinal_position;
    `);
    
    alertColumns.rows.forEach((col: any) => {

    });
    
    // List all user IDs to see format

    const userIds = await db.execute(sql`
      SELECT id, email FROM "user" LIMIT 5;
    `);
    
    userIds.rows.forEach((user: any) => {

    });
    
    // Check organization table

    const orgColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'organization'
      ORDER BY ordinal_position;
    `);
    
    orgColumns.rows.forEach((col: any) => {

    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkAllTables();
#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function checkHospitalExists() {

  try {
    // Check if hospitals table exists
    const tableCheck = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'hospitals'
      ORDER BY ordinal_position;
    `);

    tableCheck.rows.forEach((row: any) => {

    });

    // Get all hospitals
    const hospitals = await db.execute(sql`
      SELECT * FROM hospitals;
    `);

    hospitals.rows.forEach((hospital: any, index: number) => {

    });
    
    if (hospitals.rows.length === 0) {

    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkHospitalExists();
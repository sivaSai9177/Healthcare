#!/usr/bin/env tsx
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function checkHospitalsTable() {

  try {
    // Check if hospitals table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hospitals'
      )
    `);

    // Get column information
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'hospitals'
      ORDER BY ordinal_position
    `);

  } catch (error) {
    console.error('Error checking table:', error);
  }
  
  process.exit(0);
}

checkHospitalsTable();
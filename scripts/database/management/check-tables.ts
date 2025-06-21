#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function checkTables() {
  try {
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
// TODO: Replace with structured logging - /* console.log('Existing tables:') */;
    tables.rows.forEach((row: any) => {
// TODO: Replace with structured logging - /* console.log(' -', row.table_name) */;
    });
    
    // Check if alert_acknowledgments exists
    const alertAckExists = tables.rows.some((row: any) => 
      row.table_name === 'alert_acknowledgments'
    );
    
// TODO: Replace with structured logging - /* console.log('\nAlert acknowledgments table exists:', alertAckExists) */;
    
  } catch (error) {
    console.error('Failed to check tables:', error);
  }
  
  process.exit(0);
}

checkTables();
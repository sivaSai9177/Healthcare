#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function applyMigration() {
  try {
// TODO: Replace with structured logging - console.log('Applying acknowledgment fields migration...');
    
    // Add new columns to alert_acknowledgments table
    await db.execute(sql`
      ALTER TABLE alert_acknowledgments
      ADD COLUMN IF NOT EXISTS urgency_assessment VARCHAR(20),
      ADD COLUMN IF NOT EXISTS response_action VARCHAR(20),
      ADD COLUMN IF NOT EXISTS estimated_response_time INTEGER,
      ADD COLUMN IF NOT EXISTS delegated_to TEXT REFERENCES users(id)
    `);
    
// TODO: Replace with structured logging - console.log('Added columns successfully');
    
    // Add indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_alert_acknowledgments_response_action 
      ON alert_acknowledgments(response_action)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_alert_acknowledgments_delegated_to 
      ON alert_acknowledgments(delegated_to)
    `);
    
// TODO: Replace with structured logging - console.log('Added indexes successfully');
// TODO: Replace with structured logging - console.log('✅ Migration applied successfully!');
    
  } catch (error) {
    console.error('Failed to apply migration:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

applyMigration();
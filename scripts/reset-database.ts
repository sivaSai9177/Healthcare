#!/usr/bin/env bun
import { sql } from 'drizzle-orm';
import { db } from '../src/db';

async function resetDatabase() {
// TODO: Replace with structured logging - console.log('🗑️  Dropping all tables...');
  
  try {
    // Drop all tables in reverse order of dependencies
    const dropQueries = [
      // Healthcare tables
      'DROP TABLE IF EXISTS alert_timeline_events CASCADE',
      'DROP TABLE IF EXISTS patient_alerts CASCADE',
      'DROP TABLE IF EXISTS care_team_assignments CASCADE',
      'DROP TABLE IF EXISTS patient_vitals CASCADE',
      'DROP TABLE IF EXISTS patients CASCADE',
      'DROP TABLE IF EXISTS alert_metrics CASCADE',
      'DROP TABLE IF EXISTS shift_schedules CASCADE',
      'DROP TABLE IF EXISTS healthcare_audit_logs CASCADE',
      'DROP TABLE IF EXISTS notification_logs CASCADE',
      'DROP TABLE IF EXISTS alert_acknowledgments CASCADE',
      'DROP TABLE IF EXISTS alert_escalations CASCADE',
      'DROP TABLE IF EXISTS alerts CASCADE',
      'DROP TABLE IF EXISTS departments CASCADE',
      'DROP TABLE IF EXISTS healthcare_users CASCADE',
      'DROP TABLE IF EXISTS hospitals CASCADE',
      'DROP TABLE IF EXISTS alert_type_enum CASCADE',
      
      // Organization tables
      'DROP TABLE IF EXISTS organization_activity_logs CASCADE',
      'DROP TABLE IF EXISTS organization_settings CASCADE',
      'DROP TABLE IF EXISTS organization_invites CASCADE',
      'DROP TABLE IF EXISTS organization_members CASCADE',
      'DROP TABLE IF EXISTS organizations CASCADE',
      
      // Auth tables
      'DROP TABLE IF EXISTS verification CASCADE',
      'DROP TABLE IF EXISTS session CASCADE',
      'DROP TABLE IF EXISTS account CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
      
      // Audit tables
      'DROP TABLE IF EXISTS audit_log CASCADE',
      
      // Migration tables
      'DROP TABLE IF EXISTS __drizzle_migrations CASCADE',
    ];

    for (const query of dropQueries) {
      try {
        await db.execute(sql.raw(query));
// TODO: Replace with structured logging - console.log(`✅ ${query}`);
      } catch (error) {
// TODO: Replace with structured logging - console.log(`⚠️  ${query} - ${error.message}`);
      }
    }

// TODO: Replace with structured logging - console.log('\n✅ All tables dropped successfully!');
// TODO: Replace with structured logging - console.log('\n📝 Now run: bun db:migrate to create fresh tables');
    
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase().then(() => {
// TODO: Replace with structured logging - console.log('\n🎉 Database reset complete!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
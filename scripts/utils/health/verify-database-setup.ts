#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function verifySetup() {

  try {
    // Check tables exist

    const tables = [
      'user', 'organization', 'hospitals', 'healthcare_users', 
      'alerts', 'alert_acknowledgments', 'alert_timeline_events'
    ];
    
    for (const table of tables) {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = ${table}
        );
      `);
      const exists = (result.rows[0] as any).exists;

    }
    
    // Check users

    const users = await db.execute(sql`
      SELECT u.email, u.name, u.role, u.default_hospital_id,
             hu.department, hu.is_on_duty
      FROM "user" u
      LEFT JOIN healthcare_users hu ON hu.user_id = u.id
      ORDER BY u.role, u.email
    `);
    
    users.rows.forEach((user: any) => {

      if (user.department) {

      }
    });
    
    // Check alerts

    const alerts = await db.execute(sql`
      SELECT room_number, alert_type, urgency_level, status
      FROM alerts
      ORDER BY urgency_level, created_at DESC
    `);
    
    if (alerts.rows.length === 0) {

    } else {
      alerts.rows.forEach((alert: any, i) => {

      });
    }
    
    // Check hospital

    const hospitals = await db.execute(sql`
      SELECT h.name, h.code, o.name as org_name
      FROM hospitals h
      LEFT JOIN organization o ON o.id = h.organization_id
    `);
    
    hospitals.rows.forEach((hospital: any) => {

    });
    
    // Summary

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
  
  process.exit(0);
}

verifySetup();
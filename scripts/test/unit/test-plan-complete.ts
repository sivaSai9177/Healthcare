#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function generateTestPlan() {

  try {
    // Get all users
    const users = await db.execute(sql`
      SELECT u.*, hu.department, hu.is_on_duty 
      FROM "user" u
      LEFT JOIN healthcare_users hu ON hu.user_id = u.id
      ORDER BY 
        CASE u.role 
          WHEN 'nurse' THEN 1 
          WHEN 'doctor' THEN 2 
          WHEN 'operator' THEN 3 
          WHEN 'admin' THEN 4 
        END
    `);
    
    // Get alerts count
    const alertStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN urgency_level <= 2 THEN 1 END) as critical
      FROM alerts
    `);

    // Test Plan for Each Role

  } catch (error) {
    console.error('❌ Error generating test plan:', error);
  }
  
  process.exit(0);
}

generateTestPlan();